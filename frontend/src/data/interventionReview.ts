import { InterventionReview } from '../types/policy';

export const interventionReview: InterventionReview[] = [
{
  id: 'INT-1',
  name: 'Isolate sick people within 3 days',
  disease: 'Both',
  description: 'Faster testing and transport so people with symptoms are isolated quickly.',
  effect: 'Fewer cases',
  effectRange: 'About 30% to 60% fewer cases',
  cost: 'Medium',
  status: 'Recommended',
  basis: 'Approved scenarios APS-01 and APS-02'
},
{
  id: 'INT-2',
  name: 'Safe and dignified burials',
  disease: 'Both',
  description: 'Trained teams handle burials so the virus does not spread at funerals.',
  effect: 'Fewer cases',
  effectRange: 'About 15% to 40% fewer cases',
  cost: 'Low',
  status: 'Recommended',
  basis: 'Approved scenario APS-04'
},
{
  id: 'INT-3',
  name: 'Full protection for hospital staff from day one',
  disease: 'Marburg',
  description: 'Gloves, gowns and masks for all ward staff as soon as a case is suspected.',
  effect: 'Fewer health workers infected',
  effectRange: 'About 40% to 70% fewer health-worker cases',
  cost: 'Medium',
  status: 'Recommended',
  basis: 'Approved scenario APS-05'
},
{
  id: 'INT-4',
  name: 'Follow up contacts daily',
  disease: 'Both',
  description: 'Teams check every contact of a sick person each day for 21 days.',
  effect: 'Fewer cases',
  effectRange: 'About 10% to 35% fewer cases',
  cost: 'Medium',
  status: 'Under review',
  basis: 'Approved scenario APS-04'
},
{
  id: 'INT-5',
  name: 'Extra isolation beds in Rubavu',
  disease: 'Ebola',
  description: 'Open an 8-bed annex ward at Gisenyi District Hospital.',
  effect: 'Beds run short less often',
  effectRange: 'From about 4 in 10 runs to 1 in 10 runs',
  cost: 'High',
  status: 'Under review',
  basis: 'Capacity review APR-008'
}];