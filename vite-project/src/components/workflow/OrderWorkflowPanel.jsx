import { useState } from 'react'
import { advanceOrder } from '../../services/prototypeWorkflow'
import { orderStatuses } from '../../services/prototypeStore'

const labels = {
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY_FOR_PICKUP: 'Ready for pickup',
  ASSIGNED: 'Delivery assigned',
  PICKED_UP: 'Picked up',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
}

export default function OrderWorkflowPanel({ order }) {
  const [, refresh] = useState(0)
  const currentIndex = orderStatuses.indexOf(order.status)

  const advance = () => {
    advanceOrder(order)
    refresh((value) => value + 1)
  }

  return (
    <section className="workflow-panel">
      <div className="workflow-header">
        <div>
          <span className="eyebrow">Live order workflow</span>
          <h3>{order.id}</h3>
        </div>
        {currentIndex < orderStatuses.length - 1 && <button className="primary-btn" onClick={advance}>Advance status</button>}
      </div>
      <div className="workflow-steps">
        {orderStatuses.map((status, index) => (
          <div className={`workflow-step ${index <= currentIndex ? 'complete' : ''}`} key={status}>
            <span className="workflow-dot">{index <= currentIndex ? '✓' : index + 1}</span>
            <span>{labels[status]}</span>
          </div>
        ))}
      </div>
      <p className="workflow-hint">Advance the prototype from confirmation through delivery. The shared store makes this state available to the other role dashboards.</p>
    </section>
  )
}
