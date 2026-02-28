import { memo, useState } from 'react';
import { INFRA_NODES, simulateCascade, CascadeResult, InfraNode } from '@/data/regionalFeeds';

const typeIcon: Record<string, string> = {
  cable: '🔌',
  pipeline: '🛢️',
  port: '🚢',
  datacenter: '🖥️',
  chokepoint: '⚓',
};

const InfrastructureCascade = memo(() => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [cascadeResult, setCascadeResult] = useState<CascadeResult | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | InfraNode['type']>('all');

  const handleSelect = (nodeId: string) => {
    setSelectedNode(nodeId);
    const result = simulateCascade(nodeId);
    setCascadeResult(result);
  };

  const filtered = typeFilter === 'all' ? INFRA_NODES : INFRA_NODES.filter(n => n.type === typeFilter);

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">🏗️ INFRASTRUCTURE CASCADE SIMULATOR</h2>
        <span className="text-[9px] font-data text-text-secondary">● {INFRA_NODES.length} NODES</span>
        <span className="text-[8px] font-data text-alert-medium ml-auto">⚠ SIMULATION ONLY</span>
      </div>
      <div className="text-[8px] font-data text-muted-foreground mb-3 leading-relaxed">
        Select a critical infrastructure node to simulate its failure and view cascade effects on dependent regions, economies, and alternative routes.
      </div>

      {/* Type filters */}
      <div className="flex gap-1 mb-3 flex-wrap">
        {(['all', 'chokepoint', 'cable', 'pipeline', 'port', 'datacenter'] as const).map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`text-[8px] font-display tracking-wider px-2 py-0.5 rounded ${
              typeFilter === t ? 'bg-primary/10 text-primary border border-primary/20' : 'text-text-muted-custom hover:text-muted-foreground'
            }`}>
            {t === 'all' ? '🌍 ALL' : `${typeIcon[t]} ${t.toUpperCase()}`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Node selection grid */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {filtered.map(node => {
              const critColor = node.criticality === 'critical' ? 'border-alert-critical/40' : node.criticality === 'high' ? 'border-alert-high/30' : 'border-border';
              const critBadge = node.criticality === 'critical' ? 'text-alert-critical bg-alert-critical/10' : node.criticality === 'high' ? 'text-alert-high bg-alert-high/10' : 'text-alert-medium bg-alert-medium/10';
              return (
                <button key={node.id} onClick={() => handleSelect(node.id)}
                  className={`text-left bg-card-bg/60 rounded border p-2 transition-colors hover:bg-card-hover ${critColor} ${
                    selectedNode === node.id ? 'ring-1 ring-primary/40 bg-primary/5' : ''
                  }`}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{typeIcon[node.type]}</span>
                    <span className="text-[10px] font-display tracking-wide text-foreground">{node.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[7px] font-data font-bold px-1 py-0.5 rounded ${critBadge}`}>
                      {node.criticality.toUpperCase()}
                    </span>
                    <span className="text-[7px] font-data text-text-muted-custom">{node.type}</span>
                  </div>
                  <div className="text-[7px] font-data text-text-secondary mt-0.5 truncate">
                    Affects: {node.dependents.slice(0, 3).join(', ')}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cascade result */}
        <div>
          {cascadeResult ? (
            <div className="bg-card-bg/60 rounded border border-alert-critical/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{typeIcon[cascadeResult.node.type]}</span>
                <div>
                  <h3 className="text-[12px] font-display tracking-wider text-foreground">{cascadeResult.node.name}</h3>
                  <span className="text-[8px] font-data text-alert-critical">⚠ SIMULATED FAILURE</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="text-[8px] font-display tracking-wider text-muted-foreground mb-1">AFFECTED REGIONS</h4>
                  <div className="flex flex-wrap gap-1">
                    {cascadeResult.affectedRegions.map((r, i) => (
                      <span key={i} className="text-[8px] font-data text-foreground bg-alert-critical/10 border border-alert-critical/20 px-1.5 py-0.5 rounded">{r}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[8px] font-display tracking-wider text-muted-foreground mb-1">ECONOMIC IMPACT</h4>
                  <div className="text-[11px] font-data text-alert-critical font-bold">{cascadeResult.economicImpact}</div>
                </div>

                <div>
                  <h4 className="text-[8px] font-display tracking-wider text-muted-foreground mb-1">ALTERNATIVE ROUTES</h4>
                  <div className="text-[9px] font-data text-text-secondary">{cascadeResult.alternativeRoutes}</div>
                </div>

                <div>
                  <h4 className="text-[8px] font-display tracking-wider text-muted-foreground mb-1">ESTIMATED RECOVERY</h4>
                  <div className="text-[10px] font-data text-alert-medium font-bold">{cascadeResult.recoveryTime}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card-bg/60 rounded border border-border p-6 flex items-center justify-center h-full">
              <div className="text-center">
                <span className="text-3xl mb-2 block">🏗️</span>
                <p className="text-[11px] font-display tracking-wider text-muted-foreground">SELECT A NODE</p>
                <p className="text-[9px] font-data text-text-muted-custom mt-1">Click any infrastructure node to simulate cascade failure</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
InfrastructureCascade.displayName = 'InfrastructureCascade';

export default InfrastructureCascade;
