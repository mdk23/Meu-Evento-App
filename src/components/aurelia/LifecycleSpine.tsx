import { Fragment } from 'react';
import { LifecycleStage } from '@/lib/booking-lifecycle';

interface LifecycleSpineProps {
  stages: LifecycleStage[];
}

export default function LifecycleSpine({ stages }: LifecycleSpineProps) {
  return (
    <div className="spine" style={{ padding: '10px 34px' }}>
      {stages.map((stage, idx) => (
        <Fragment key={stage.label}>
          <div className={`node${stage.state === 'done' ? ' done' : ''}${stage.state === 'current' ? ' current' : ''}`}>
            <span className="dot" />
            <span className="label">{stage.label}</span>
          </div>
          {idx < stages.length - 1 && (
            <div className="line">
              <span style={{ width: stage.state === 'done' ? '100%' : '0%' }} />
            </div>
          )}
        </Fragment>
      ))}
    </div>
  );
}
