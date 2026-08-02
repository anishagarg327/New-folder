import React from 'react';
import { useStore } from '../store/useStore';
import { Lightbulb, AlertTriangle, ArrowRight, Zap, RefreshCw, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DecisionSupport = () => {
  const { getOperationalRecommendations } = useStore();
  const recommendations = getOperationalRecommendations();

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'var(--status-red)';
      case 'High': return 'var(--status-red)';
      case 'Medium': return 'var(--status-yellow)';
      default: return 'var(--accent-blue)';
    }
  };

  return (
    <div className="glass-panel" style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header" style={{ justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Lightbulb size={16} color="var(--status-yellow)" />
          Operational AI Insights
        </div>
        {recommendations.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
            <Zap size={10} fill="currentColor" /> AI ACTIVE
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {recommendations.length === 0 ? (
          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-surface)', borderRadius: '6px', fontSize: '0.8rem' }}>
            <CheckCircle2 size={24} style={{ margin: '0 auto 0.5rem', color: 'var(--status-green)', opacity: 0.5 }} />
            Operations Normal. No insights active.
          </div>
        ) : (
          <AnimatePresence>
            {recommendations.slice(0, 3).map(rec => {
              const isSelected = useStore.getState().selectedFlightId && useStore.getState().selectedFlightId === rec.relatedFlight;
              return (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                key={rec.id} 
                onClick={() => rec.relatedFlight && useStore.getState().setSelectedFlight(rec.relatedFlight)}
                style={{ 
                  background: isSelected ? 'var(--bg-surface-hover)' : 'var(--bg-surface)', 
                  border: '1px solid var(--border-light)',
                  borderLeft: `3px solid ${getPriorityColor(rec.priority)}`,
                  borderRadius: '0 8px 8px 0',
                  padding: '0.6rem 0.75rem',
                  display: 'flex', flexDirection: 'column', gap: '0.4rem',
                  cursor: rec.relatedFlight ? 'pointer' : 'default',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <AlertTriangle size={12} color={getPriorityColor(rec.priority)} /> {rec.reason}
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '0.35rem 0.5rem', borderRadius: '4px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <ArrowRight size={10} /> <span style={{ fontWeight: 600 }}>Action:</span> {rec.action}
                  </div>
                </div>
              </motion.div>
            )})}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
