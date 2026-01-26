import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Assignment } from '../types';
import { Icons } from './Icons';

interface SubjectObjectivesDropdownProps {
    currentSubject: string | null;
    allAssignments: Assignment[];
    onSelectAssignment: (id: string) => void;
    playUISound: (sound: 'action' | 'switch') => void;
}

export const SubjectObjectivesDropdown: React.FC<SubjectObjectivesDropdownProps> = ({
    currentSubject,
    allAssignments,
    onSelectAssignment,
    playUISound
}) => {
    const [isOpen, setIsOpen] = useState(false);

    // Filter assignments by current subject and incomplete status
    const subjectObjectives = currentSubject
        ? allAssignments.filter(
            (a) => a.subject === currentSubject && !a.isCompleted
        )
        : [];

    // Don't render if no subject or no objectives
    if (!currentSubject || subjectObjectives.length === 0) {
        return null;
    }

    const handleToggle = () => {
        setIsOpen(!isOpen);
        playUISound('switch');
    };

    const handleSelectObjective = (id: string) => {
        onSelectAssignment(id);
        setIsOpen(false);
        playUISound('action');
    };

    const getPriorityColor = (dueDate: string) => {
        const due = new Date(dueDate);
        const today = new Date();
        const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays <= 1) return 'text-red-500';
        if (diffDays <= 3) return 'text-amber-500';
        return 'text-blue-500';
    };

    return (
        <div className="fixed top-6 right-24 z-50">
            <button
                onClick={handleToggle}
                className={`
          flex items-center gap-3 px-5 py-3 rounded-2xl
          bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10
          hover:border-blue-500/40 transition-all
          ${isOpen ? 'border-blue-500/40 bg-blue-500/5' : ''}
        `}
            >
                <Icons.Target className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-bold">
                    {currentSubject} ({subjectObjectives.length})
                </span>
                <Icons.ChevronRight
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''
                        }`}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Dropdown */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                        >
                            <div className="p-4 border-b border-gray-100 dark:border-white/10">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">
                                    {currentSubject} Objectives
                                </h3>
                            </div>

                            <div className="max-h-96 overflow-y-auto">
                                {subjectObjectives.map((obj) => {
                                    const dueDate = new Date(obj.dueDate);
                                    const isToday =
                                        dueDate.toDateString() === new Date().toDateString();
                                    const isTomorrow =
                                        dueDate.toDateString() ===
                                        new Date(Date.now() + 86400000).toDateString();

                                    return (
                                        <button
                                            key={obj.id}
                                            onClick={() => handleSelectObjective(obj.id)}
                                            className="w-full p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left border-b border-gray-100 dark:border-white/5 last:border-0"
                                        >
                                            <div className="flex items-start gap-3">
                                                <Icons.Circle
                                                    className={`w-4 h-4 mt-0.5 ${getPriorityColor(
                                                        obj.dueDate
                                                    )}`}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                                                        {obj.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {isToday
                                                            ? '⚡ Due Today'
                                                            : isTomorrow
                                                                ? '📅 Due Tomorrow'
                                                                : `📅 Due ${dueDate.toLocaleDateString()}`}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
