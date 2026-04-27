import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function DoctorFinder({ doctors: propDoctors, disease }) {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState(propDoctors || []);
  const [showBooking, setShowBooking] = useState({});
  const [appointmentDate, setAppointmentDate] = useState("");
  const [bookingLoading, setBookingLoading] = useState({});
  const [bookingSuccess, setBookingSuccess] = useState({});

  React.useEffect(() => {
    if (propDoctors) {
      setDoctors(propDoctors);
    } else if (!doctors.length) {
      fetchDoctors();
    }
  }, [propDoctors]);

  const fetchDoctors = async () => {
    try {
      const params = disease ? { disease } : {};
      const res = await axios.get(`${API_BASE}/api/doctors`, { params });
      setDoctors(res.data.doctors || []);
    } catch (err) {
      console.error("Doctor fetch error:", err);
    }
  };

  const handleBookAppointment = async (doctorId, doctorName) => {
    if (!appointmentDate) {
      alert("Please select an appointment date");
      return;
    }

    setBookingLoading((prev) => ({ ...prev, [doctorId]: true }));
    setBookingSuccess((prev) => ({ ...prev, [doctorId]: false }));

    try {
      const res = await axios.post(`${API_BASE}/api/doctors/${doctorId}/book`, {
        appointment_date: appointmentDate,
        disease: disease || "",
        symptoms: [],
      });

      if (res.data.appointment) {
        setBookingSuccess((prev) => ({ ...prev, [doctorId]: true }));
        setShowBooking((prev) => ({ ...prev, [doctorId]: false }));
        setAppointmentDate("");
        
        setTimeout(() => {
          setBookingSuccess((prev) => ({ ...prev, [doctorId]: false }));
        }, 3000);
      }
    } catch (err) {
      console.error("Booking error:", err);
      alert(err.response?.data?.error || "Failed to book appointment");
    } finally {
      setBookingLoading((prev) => ({ ...prev, [doctorId]: false }));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Recommended Doctors
      </h2>
      
      {doctors.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 mb-4">
            No doctors available at the moment.
          </p>
          <button
            onClick={fetchDoctors}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {doc.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {doc.specialization}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{doc.clinic}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-yellow-500 mb-1">
                    <span>?</span>
                    <span className="text-sm font-medium text-gray-700">
                      {doc.rating || "4.5"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {doc.experience_years || "10"} yrs exp
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span>?? {doc.distance_km} km</span>
                  <span>?? ?{doc.consultation_fee || "800"}</span>
                  <span>?? {doc.phone}</span>
                </div>
              </div>

              {bookingSuccess[doc.id] && (
                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                  ? Appointment booked successfully!
                </div>
              )}

              {!showBooking[doc.id] ? (
                <button
                  onClick={() =>
                    setShowBooking((prev) => ({ ...prev, [doc.id]: true }))
                  }
                  className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition"
                >
                  Book Appointment
                </button>
              ) : (
                <div className="mt-3 space-y-2">
                  <input
                    type="datetime-local"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleBookAppointment(doc.id, doc.name)
                      }
                      disabled={bookingLoading[doc.id]}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm disabled:opacity-50"
                    >
                      {bookingLoading[doc.id] ? "Booking..." : "Confirm"}
                    </button>
                    <button
                      onClick={() => {
                        setShowBooking((prev) => ({ ...prev, [doc.id]: false }));
                        setAppointmentDate("");
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          ?? These are recommended doctors based on your condition. Always
          verify credentials before booking.
        </p>
      </div>
    </div>
  );
}
