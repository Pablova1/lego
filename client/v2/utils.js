'use strict';

/**
 * Retourne la liste des ID lego extraits des deals
 * Dans ce code, on n'en a plus forcément besoin, 
 * mais on la laisse si vous souhaitez l'utiliser pour un select d’IDs.
 * @param {Array} deals
 * @returns {Array} tableau d’IDs uniques
 */
function getIdsFromDeals(deals) {
  const uniqueIds = new Set(deals.map(deal => deal.id));
  return [...uniqueIds];
}
