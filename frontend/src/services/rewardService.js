import {
  mockUserPoints,
  mockRewardTransactions,
  mockLatestRewardSummary,
} from "../data/mockRewards";

export function getPointsBalance() {
  return mockUserPoints;
}

export function getRewardTransactions() {
  return mockRewardTransactions;
}

export function getLatestRewardSummary() {
  return mockLatestRewardSummary;
}