import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, BookOpen, Wrench, CheckCircle2, 
  Tag, Clock, Plus, X, Sparkles, Filter 
} from 'lucide-react';
import { KnowledgeBaseArticle, TicketCategory } from '../../types';
import { fetchKB, createKBArticle } from '../../services/api';

export const KnowledgeBaseView: React.FC = () => {
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeBaseArticle | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // New article form
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TicketCategory>('Hardware');
  const [newDesc, setNewDesc] = useState('');
  const [newSteps, setNewSteps] = useState('');
  const [newSolution, setNewSolution] = useState('');
  const [newTags, setNewTags] = useState('');

  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchKB(search, categoryFilter);
      setArticles(data);
    } catch (e) {
      console.error('Error fetching KB articles:', e);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    loadArticles();
  }, [search, categoryFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim() || !newSolution.trim()) return;

    try {
      await createKBArticle({
        title: newTitle,
        category: newCategory,
        description: newDesc,
        troubleshootingSteps: newSteps.split('\n').filter(s => s.trim().length > 0),
        solution: newSolution,
        tags: newTags.split(',').map(t => t.trim()).filter(Boolean)
      });
      setCreateModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      setNewSteps('');
      setNewSolution('');
      setNewTags('');
      loadArticles();
    } catch (e) {
      console.error('Failed to create article:', e);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            IT Service Knowledge Base & Standard Operating Procedures
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Verified enterprise troubleshooting documentation actively queried by the Knowledge Base Agent during incident triage.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Create New KB Article
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles by symptom, keyword, hardware, error code..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Categories ({articles.length})</option>
          <option value="Hardware">Hardware</option>
          <option value="Network and Wi-Fi">Network and Wi-Fi</option>
          <option value="Password and Access">Password and Access</option>
          <option value="Software Installation">Software Installation</option>
          <option value="Email Issues">Email Issues</option>
          <option value="System Performance">System Performance</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Article Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {articles.map(article => (
          <div
            key={article.id}
            onClick={() => setSelectedArticle(article)}
            className="bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all p-5 shadow-2xs flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {article.id}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {article.category}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-2">
                {article.title}
              </h3>

              <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                {article.description}
              </p>
            </div>

            <div>
              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-3">
                {article.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-100">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-300" />
                  {article.updatedAt}
                </span>
                <span className="text-blue-600 font-semibold group-hover:underline">
                  Read SOP Guide →
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Article Details Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {selectedArticle.id}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {selectedArticle.category} · Updated {selectedArticle.updatedAt}
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  {selectedArticle.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Overview & Failure Context
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {selectedArticle.description}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-blue-600" />
                Technical Troubleshooting Instructions
              </h4>
              <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                {selectedArticle.troubleshootingSteps.map((step, i) => (
                  <li key={i} className="leading-relaxed">{step}</li>
                ))}
              </ol>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Standard Remediation Solution
              </h4>
              <div className="bg-emerald-50/60 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-950 font-medium leading-relaxed">
                {selectedArticle.solution}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-400">
                Matched autonomously during pipeline execution by Knowledge Base Agent.
              </span>
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800"
              >
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Add Knowledge Base Standard Operating Procedure
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Article Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Cisco AnyConnect VPN Certificate Reset"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as TicketCategory)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                >
                  <option value="Hardware">Hardware</option>
                  <option value="Network and Wi-Fi">Network and Wi-Fi</option>
                  <option value="Password and Access">Password and Access</option>
                  <option value="Software Installation">Software Installation</option>
                  <option value="Email Issues">Email Issues</option>
                  <option value="System Performance">System Performance</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description & Failure Context</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Summarize the observed problem and symptoms..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Troubleshooting Instructions (one per line)</label>
                <textarea
                  rows={3}
                  value={newSteps}
                  onChange={(e) => setNewSteps(e.target.value)}
                  placeholder="Step 1: Check network adapter&#10;Step 2: Clear local cache"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Remediation Solution</label>
                <textarea
                  rows={2}
                  value={newSolution}
                  onChange={(e) => setNewSolution(e.target.value)}
                  placeholder="Exact steps or commands to resolve the issue..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="vpn, network, certificate, macos"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800"
                >
                  Save to Knowledge Base
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
