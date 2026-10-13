import React, { useState } from 'react';
import { X, Search, Plus, Check, GraduationCap, MapPin, Building2 } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';

export const CollegeSelectorModal: React.FC = () => {
  const {
    campuses,
    selectedCampus,
    setSelectedCampus,
    addCampus,
    isCollegeModalOpen,
    setIsCollegeModalOpen,
    products,
  } = useMarketplace();

  const [searchTerm, setSearchTerm] = useState('');
  const [newCollegeName, setNewCollegeName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isCollegeModalOpen) return null;

  const handleClose = () => {
    setIsCollegeModalOpen(false);
    setSearchTerm('');
    setShowAddForm(false);
    setNewCollegeName('');
    setErrorMsg('');
  };

  const handleSelect = (campus: string) => {
    setSelectedCampus(campus);
    handleClose();
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCollegeName.trim();
    if (!trimmed) {
      setErrorMsg('Please enter a college name.');
      return;
    }
    if (trimmed.length < 3) {
      setErrorMsg('College name must be at least 3 characters.');
      return;
    }

    addCampus(trimmed);
    setSelectedCampus(trimmed);
    handleClose();
  };

  const filteredCampuses = campuses.filter((c) =>
    c.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProductCountForCampus = (campus: string) => {
    if (campus === 'All Campuses') return products.length;
    const campusKey = campus.split(' - ')[0];
    return products.filter((p) => p.campus.includes(campusKey) || p.campus === campus).length;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Select Your College</h3>
              <p className="text-xs text-slate-500">Filter campus marketplace listings by your institute</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by college name, city or acronym (e.g. IIT, DTU, NSUT)..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#15803D] transition-colors"
              autoFocus
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* College List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 divide-y divide-slate-50">
          {filteredCampuses.map((campus) => {
            const isSelected = selectedCampus === campus;
            const count = getProductCountForCampus(campus);

            return (
              <button
                key={campus}
                type="button"
                onClick={() => handleSelect(campus)}
                className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-950 font-semibold border border-emerald-200 shadow-2xs'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {campus === 'All Campuses' ? (
                      <Building2 className="w-4 h-4" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm truncate">{campus}</p>
                    <p className="text-[11px] text-slate-400">
                      {campus === 'All Campuses'
                        ? 'View listings across all universities'
                        : `${count} listing${count === 1 ? '' : 's'} available`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isSelected && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                      <Check className="w-3 h-3 text-emerald-700" />
                      Active
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {filteredCampuses.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs">
              <p className="font-semibold text-slate-700 mb-1">No colleges found matching "{searchTerm}"</p>
              <p className="mb-4">You can add your college to Campus Mart right now!</p>
              <button
                onClick={() => {
                  setNewCollegeName(searchTerm);
                  setShowAddForm(true);
                }}
                className="px-4 py-2 bg-[#064E3B] text-white rounded-lg font-semibold text-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add "{searchTerm}" as a New College</span>
              </button>
            </div>
          )}
        </div>

        {/* Add College Section */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          {!showAddForm ? (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="w-full py-2.5 px-4 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center justify-center gap-2 transition-all shadow-2xs"
            >
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>Can't find your campus? Add New College</span>
            </button>
          ) : (
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Add Your College / Campus</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setErrorMsg('');
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>

              <input
                type="text"
                value={newCollegeName}
                onChange={(e) => {
                  setNewCollegeName(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="e.g. SRM Institute of Science and Technology, Chennai"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#15803D]"
                autoFocus
              />

              {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#064E3B] hover:bg-[#15803D] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add & Switch College</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
