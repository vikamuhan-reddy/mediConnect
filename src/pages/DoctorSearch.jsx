import React from 'react';
import { Search, Filter, Star, MapPin, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import DoctorCard from '../components/DoctorCard';
import SearchBar from '../components/SearchBar';
import Skeleton from '../components/Skeleton';

const SPECIALIZATIONS = [
  'All',
  'Cardiologist',
  'Dermatologist',
  'Pediatrician',
  'Neurologist',
  'Orthopedic',
  'Nephrologist',
  'Endocrinologist',
  'Psychiatrist',
  'Ophthalmologist',
  'Pulmonologist',
  'Gastroenterologist',
  'Oncologist',
  'Gynecologist',
  'ENT Specialist',
  'Urologist',
  'Rheumatologist',
  'General Physician',
];

export default function DoctorSearch() {
  const [doctors, setDoctors] = React.useState([]);
  const [filteredDoctors, setFilteredDoctors] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [specialization, setSpecialization] = React.useState('All');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [suggestions, setSuggestions] = React.useState([]);
  const itemsPerPage = 4;

  React.useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await api.get('/doctors');
        const data = res.data?.doctors || res.data || [];
        setDoctors(data);
        setFilteredDoctors(data);
      } catch (err) {
        console.error('Failed to fetch doctors', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  React.useEffect(() => {
    let result = doctors;

    if (searchQuery) {
      result = result.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.specialization.toLowerCase().includes(searchQuery.toLowerCase())
      );

      const uniqueSpecs = Array.from(new Set(doctors.map(d => d.specialization)));
      const filteredSpecs = uniqueSpecs.filter(s =>
        s.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSuggestions(filteredSpecs.slice(0, 5));
    } else {
      setSuggestions([]);
    }

    if (specialization !== 'All') {
      result = result.filter(d => d.specialization === specialization);
    }

    setFilteredDoctors(result);
    setCurrentPage(1);
  }, [searchQuery, specialization, doctors]);

  // Only show specializations that have at least one doctor
  const specializationsFromData = Array.from(new Set(doctors.map(d => d.specialization)));
  const specializations = ['All', ...SPECIALIZATIONS.slice(1).filter(s =>
    specializationsFromData.includes(s)
  )];

  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);
  const paginatedDoctors = filteredDoctors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Find a Specialist</h1>
        <p className="text-slate-500">Search and book appointments with top-rated doctors.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* ── Filters Sidebar ── */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </h3>
              <button
                onClick={() => { setSearchQuery(''); setSpecialization('All'); }}
                className="text-xs font-bold text-emerald-600 hover:underline"
              >
                Reset
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Specialization
                </label>
                <div className="space-y-1 max-h-[460px] overflow-y-auto pr-1">
                  {loading
                    ? [1,2,3,4,5,6].map(i => (
                        <div key={i} className="h-8 bg-slate-100 rounded-xl animate-pulse mb-1" />
                      ))
                    : specializations.map(spec => (
                        <button
                          key={spec}
                          onClick={() => setSpecialization(spec)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center justify-between ${
                            specialization === spec
                              ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-200'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>{spec}</span>
                          {spec !== 'All' && (
                            <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${
                              specialization === spec
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-400'
                            }`}>
                              {doctors.filter(d => d.specialization === spec).length}
                            </span>
                          )}
                        </button>
                      ))
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Search Results ── */}
        <div className="md:col-span-3 space-y-6">
          <div className="relative">
            <SearchBar onSearch={setSearchQuery} />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden">
                {suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => { setSpecialization(s); setSearchQuery(''); }}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                  >
                    Search for <span className="font-bold text-emerald-600">{s}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing <span className="font-bold text-slate-900">{filteredDoctors.length}</span> doctors
              {specialization !== 'All' && (
                <> · <span className="font-semibold text-emerald-600">{specialization}</span></>
              )}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Sort by:</span>
              <button className="flex items-center gap-1 text-sm font-bold text-slate-900 hover:text-emerald-600">
                Popularity
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-5 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-10 flex-1" />
                      <Skeleton className="h-10 flex-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : paginatedDoctors.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {paginatedDoctors.map(doctor => (
                  <DoctorCard key={doctor.id || doctor._id} doctor={doctor} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-8">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-200 rounded-xl disabled:opacity-50 hover:bg-slate-50 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                        currentPage === i + 1
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                          : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-slate-200 rounded-xl disabled:opacity-50 hover:bg-slate-50 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No doctors found</h3>
              <p className="text-slate-500">Try adjusting your search or filters to find what you're looking for.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}