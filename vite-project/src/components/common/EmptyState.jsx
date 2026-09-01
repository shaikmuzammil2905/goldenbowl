import { ShoppingBag } from 'lucide-react';

export function EmptyState({ title = 'No items found', text = 'Try tweaking your filters or search term.', icon: Icon = ShoppingBag }) {
  return (
    <div className="empty">
      <Icon size={32} />
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}
