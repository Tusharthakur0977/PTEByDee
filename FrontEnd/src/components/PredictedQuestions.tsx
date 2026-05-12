import React, { useEffect, useState } from 'react';
import { 
  Flame, 
  ChevronRight, 
  Loader2, 
  Target,
  ArrowRight
} from 'lucide-react';
import { getPredictedQuestions } from '../services/portal';
import { useNavigate } from 'react-router-dom';
import { getPracticePagePath } from '../utils/questionTypeToSlug';

const PredictedQuestions: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupedData, setGroupedData] = useState<any>({});
  const [filter, setFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPredictedQuestions({
        predictionLevel: filter === 'ALL' ? undefined : filter
      });
      setGroupedData(data.groupedByType || {});
    } catch (err: any) {
      console.error('Error fetching predicted questions:', err);
      setError('Failed to load predicted questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTypeName = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getPredictionColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 border-red-100 dark:border-red-800';
      case 'MEDIUM': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 border-amber-100 dark:border-amber-800';
      case 'LOW': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-800';
      default: return 'text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-400 border-slate-100 dark:border-slate-700';
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'HARD': return 'text-purple-600';
      case 'MEDIUM': return 'text-blue-600';
      case 'EASY': return 'text-emerald-600';
      default: return 'text-slate-600';
    }
  };

  if (loading && Object.keys(groupedData).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-600 dark:text-slate-400 font-medium">Loading predicted questions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-500 fill-orange-500" />
            Most Predicted Questions
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Questions with the highest probability of appearing in upcoming exams.
          </p>
        </div>

        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
          {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setFilter(l)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                filter === l 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {l === 'ALL' ? 'All' : l.charAt(0) + l.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {!loading && Object.keys(groupedData).length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
          <Target className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No predicted questions found</h3>
          <p className="text-slate-500 dark:text-slate-400">Try changing the filter or check back later.</p>
        </div>
      )}

      {/* Grouped Questions */}
      <div className="grid grid-cols-1 gap-10">
        {Object.entries(groupedData).map(([typeName, data]: [string, any]) => (
          <section key={typeName} className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                {formatTypeName(typeName)}
              </h3>
              <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-full">
                {data.questions.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.questions.map((q: any) => (
                <div 
                  key={q.id}
                  onClick={() => navigate(getPracticePagePath(q.questionType.name as any))}
                  className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer hover:shadow-lg hover:shadow-blue-500/5"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-mono text-sm font-bold text-slate-500 group-hover:text-blue-600 transition-colors">
                      {q.questionCode}
                    </span>
                    <div className={`px-2 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${getPredictionColor(q.predictionLevel)}`}>
                      {q.predictionLevel} Predicted
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 min-h-[2.5rem]">
                      {q.textContent || q.questionStatement || "Practice this question to improve your score."}
                    </p>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${getDifficultyColor(q.difficultyLevel)}`}>
                          {q.difficultyLevel}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Practice</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default PredictedQuestions;
