import React, { useState } from 'react';
import { Search, CheckSquare, Square } from 'lucide-react';

const MultiSelectSearchList = ({ items, placeholder, onAddSelected, buttonText, buttonColor }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

    const filtered = items.filter(item => 
        `${item.firstName || ''} ${item.lastName || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.email && item.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const toggleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(x => x !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const toggleAll = () => {
        if (selectedIds.length === filtered.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filtered.map(x => x.id));
        }
    };

    const handleAdd = () => {
        if (selectedIds.length === 0) return;
        onAddSelected(selectedIds);
        setSelectedIds([]);
        setSearchQuery('');
    };

    return (
        <div className="border border-gray-100 rounded-3xl p-4 bg-gray-50/50 space-y-3 font-sans">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={placeholder || "Search users..."}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary-100 transition"
                />
            </div>

            <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-2xl bg-white divide-y divide-gray-50 shadow-inner">
                {filtered.map(item => {
                    const isSelected = selectedIds.includes(item.id);
                    return (
                        <div 
                            key={item.id} 
                            onClick={() => toggleSelect(item.id)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                            <div className="text-primary-600 flex items-center justify-center">
                                {isSelected ? (
                                    <CheckSquare size={18} className="fill-primary-50 text-primary-600" />
                                ) : (
                                    <Square size={18} className="text-gray-300" />
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-black text-gray-900 leading-tight">
                                    {item.firstName} {item.lastName}
                                </div>
                                <div className="text-xs text-gray-400 font-medium">
                                    {item.email} {item.role ? `• ${item.role}` : ''}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {filtered.length === 0 && (
                    <div className="p-6 text-center text-xs text-gray-400 font-bold">No users found.</div>
                )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
                {filtered.length > 0 && (
                    <button 
                        type="button" 
                        onClick={toggleAll}
                        className="text-xs text-gray-500 hover:text-gray-800 font-bold transition-colors"
                    >
                        {selectedIds.length === filtered.length ? "Deselect All" : "Select All"}
                    </button>
                )}
                <button
                    type="button"
                    disabled={selectedIds.length === 0}
                    onClick={handleAdd}
                    className={`px-5 py-3 rounded-2xl text-xs font-black text-white disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-sm ${buttonColor || 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/20'}`}
                >
                    {buttonText || "Add Selected"} ({selectedIds.length})
                </button>
            </div>
        </div>
    );
};

export default MultiSelectSearchList;
