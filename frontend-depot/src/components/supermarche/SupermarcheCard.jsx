import React from 'react';

const SupermarcheCard = ({ rayon, onSelect }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="font-semibold">{rayon.nom}</h3>
      <button onClick={onSelect} className="text-blue-500">Voir</button>
    </div>
  );
};

export default SupermarcheCard;
