import React, { useState } from 'react';

const DraggableTrainingSchedule = () => {
  const [trainingItems, setTrainingItems] = useState([
    { id: 1, day: 'Monday', activity: 'Speed Training', time: '9:00 AM', priority: 1 },
    { id: 2, day: 'Wednesday', activity: 'Strength Training', time: '7:00 PM', priority: 2 },
    { id: 3, day: 'Friday', activity: 'Team Practice', time: '6:00 PM', priority: 3 },
    { id: 4, day: 'Saturday', activity: 'Game Day', time: '2:00 PM', priority: 4 }
  ]);

  const [draggedItem, setDraggedItem] = useState(null);

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetItem) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.id === targetItem.id) {
      return;
    }

    const newItems = [...trainingItems];
    const draggedIndex = newItems.findIndex(item => item.id === draggedItem.id);
    const targetIndex = newItems.findIndex(item => item.id === targetItem.id);

    // Remove dragged item from its current position
    const [removed] = newItems.splice(draggedIndex, 1);
    
    // Insert dragged item at target position
    newItems.splice(targetIndex, 0, removed);

    // Update priorities based on new order
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      priority: index + 1
    }));

    setTrainingItems(updatedItems);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  return (
    <div className="draggable-training-schedule">
      <h4>Weekly Training Schedule (Drag to Reorder)</h4>
      <div className="training-items">
        {trainingItems.map((item) => (
          <div
            key={item.id}
            className={`training-item ${draggedItem?.id === item.id ? 'dragging' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, item)}
            onDragEnd={handleDragEnd}
          >
            <div className="drag-handle">⋮⋮</div>
            <div className="training-content">
              <div className="training-day">{item.day}</div>
              <div className="training-activity">{item.activity}</div>
              <div className="training-time">{item.time}</div>
            </div>
            <div className="priority-badge">#{item.priority}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DraggableTrainingSchedule; 