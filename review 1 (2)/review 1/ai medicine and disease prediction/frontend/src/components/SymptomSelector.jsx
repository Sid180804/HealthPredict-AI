import React, { useState } from "react";
import { SparklesIcon, MagnifyingGlassIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";

const SYMPTOM_CATEGORIES = {
  "General": ["Fever", "Fatigue", "Chills", "Night Sweats", "Weight Loss", "Weight Gain", "Loss of Appetite"],
  "Head & Neurological": ["Headache", "Dizziness", "Confusion", "Numbness", "Fainting", "Memory Loss", "Tremors", "Vision Changes"],
  "Respiratory": ["Cough", "Shortness of Breath", "Wheezing", "Sore Throat", "Runny Nose", "Sneezing", "Nasal Congestion", "Chest Tightness"],
  "Cardiovascular": ["Chest Pain", "Palpitations", "Rapid Heartbeat", "Swollen Ankles", "Cold Sweats"],
  "Digestive": ["Nausea", "Vomiting", "Stomach Pain", "Diarrhea", "Constipation", "Heartburn", "Bloating", "Indigestion"],
  "Musculoskeletal": ["Body Pain", "Joint Pain", "Muscle Pain", "Back Pain", "Neck Pain", "Muscle Weakness", "Joint Swelling"],
  "Skin": ["Rash", "Itching", "Redness", "Bruising", "Hives", "Dry Skin", "Changes in Moles"]
};

// Flatten for search
const ALL_SYMPTOMS = Object.values(SYMPTOM_CATEGORIES).flat();

export default function SymptomSelector({ selected, setSelected, onFreeTextSubmit }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [freeText, setFreeText] = useState("");
  const [showFreeText, setShowFreeText] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredSymptoms = ALL_SYMPTOMS.filter((symptom) =>
    symptom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggle = (symptom) => {
    if (selected.includes(symptom)) {
      setSelected(selected.filter((s) => s !== symptom));
    } else {
      setSelected([...selected, symptom]);
    }
  };

  const handleFreeTextSubmit = () => {
    if (freeText.trim() && onFreeTextSubmit) {
      onFreeTextSubmit(freeText);
      setFreeText("");
      setShowFreeText(false);
    }
  };

  const clearSymptoms = () => {
    setSelected([]);
  };

  return (
    <div className="bg-white/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-100/50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-primary-800">
            What are you experiencing?
          </h2>
          <p className="text-sm text-slate-500 mt-1">Select all symptoms that apply to you</p>
        </div>
        <button
          onClick={() => setShowFreeText(!showFreeText)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${showFreeText
              ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
              : "bg-gradient-to-r from-primary-50 to-accent-50 text-primary-700 hover:from-primary-100 hover:to-accent-100 border border-primary-100"
            }`}
        >
          <SparklesIcon className="w-4 h-4 text-primary-500" />
          {showFreeText ? "Browse Symptoms" : "Use Describe with AI"}
        </button>
      </div>

      {/* AI Free Text Input */}
      <div className={`transition-all duration-300 overflow-hidden ${showFreeText ? 'max-h-96 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
        <div className="p-5 bg-gradient-to-br from-indigo-50 to-blue-50/50 rounded-2xl border border-indigo-100">
          <label className="block text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-2">
            <SparklesIcon className="w-4 h-4" />
            Describe your symptoms in your own words
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleFreeTextSubmit()}
              placeholder="e.g., I've had a headache and fever for 3 days..."
              className="flex-1 px-4 py-3 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm transition-all"
            />
            <button
              onClick={handleFreeTextSubmit}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 hover:shadow-lg font-medium transition-all active:scale-95"
            >
              Extract
            </button>
          </div>
          <p className="text-xs text-indigo-400 mt-3 font-medium">
            Our specialized AI will automatically detect and extract the medical symptoms from your description.
          </p>
        </div>
      </div>

      {/* Search & Categories */}
      {!showFreeText && (
        <>
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search specific symptoms..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Category Tabs */}
          {!searchTerm && (
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setActiveCategory("All")}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${activeCategory === "All"
                    ? "bg-slate-800 text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
              >
                Frequent
              </button>
              {Object.keys(SYMPTOM_CATEGORIES).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${activeCategory === cat
                      ? "bg-primary-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Symptom Grid Wrapper */}
          <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4 max-h-80 overflow-y-auto custom-scrollbar relative">

            {searchTerm ? (
              // Search Results
              <div className="flex flex-wrap gap-2.5">
                {filteredSymptoms.map((sym, index) => (
                  <SymptomChip key={index} symptom={sym} selected={selected.includes(sym)} onClick={() => toggle(sym)} />
                ))}
                {filteredSymptoms.length === 0 && (
                  <div className="w-full text-center py-8 text-slate-500">
                    No symptoms found matching "{searchTerm}"
                  </div>
                )}
              </div>
            ) : activeCategory === "All" ? (
              // All Categories View
              <div className="space-y-6">
                {Object.entries(SYMPTOM_CATEGORIES).map(([category, symptoms]) => (
                  <div key={category}>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">{category}</h3>
                    <div className="flex flex-wrap gap-2.5">
                      {symptoms.map((sym, index) => (
                        <SymptomChip key={index} symptom={sym} selected={selected.includes(sym)} onClick={() => toggle(sym)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Specific Category View
              <div className="flex flex-wrap gap-2.5 min-h-[100px]">
                {SYMPTOM_CATEGORIES[activeCategory].map((sym, index) => (
                  <SymptomChip key={index} symptom={sym} selected={selected.includes(sym)} onClick={() => toggle(sym)} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Selected Symptoms Summary Footer */}
      {selected.length > 0 && (
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="bg-primary-100 text-primary-700 py-0.5 px-2 rounded-md text-xs">{selected.length}</span>
              Selected Symptoms
            </p>
            <button onClick={clearSymptoms} className="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1">
              <XMarkIcon className="w-3 h-3" /> Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selected.map((sym) => (
              <span
                key={sym}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg text-sm font-medium shadow-sm shadow-primary-500/20 active:scale-95 transition-transform cursor-pointer"
                onClick={() => toggle(sym)}
                title="Click to remove"
              >
                {sym}
                <XMarkIcon className="w-4 h-4 opacity-70 hover:opacity-100" />
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent for the individual selectable chips
function SymptomChip({ symptom, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border-2 overflow-hidden group
        ${selected
          ? "bg-primary-50 text-primary-700 border-primary-500 shadow-[0_0_15px_rgba(var(--color-primary-500),0.15)]"
          : "bg-white text-slate-600 border-white hover:border-primary-200 hover:bg-slate-50 hover:text-slate-800 shadow-sm"
        }
      `}
    >
      <div className="flex items-center gap-2 relative z-10">
        <div className={`transition-all duration-300 ${selected ? 'w-4 opacity-100' : 'w-0 opacity-0 -ml-2'}`}>
          <CheckIcon className="w-4 h-4 text-primary-600" />
        </div>
        <span>{symptom}</span>
      </div>

      {/* Subtle background glow effect on hover */}
      {!selected && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </button>
  );
}
