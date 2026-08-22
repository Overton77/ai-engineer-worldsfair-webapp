---
name: stock-research
version: 1.0.0
---
# Source-grounded stock research

Use only the authenticated read-only endpoint `/api/mcp/stock-research`.
Allowed JSON-RPC methods are exactly `stock_research.status` and `stock_research.approved_bundle`.
Never request or handle brokerage credentials, connect to trade/order endpoints, or describe a paper-trade recommendation as personalized advice.
Only approved bundles may be read. Preserve every evidence URL, publisher, retrieval timestamp, publication timestamp, and exact excerpt/structured fact. Reject evidence published after the bundle `asOf` value. Do not infer uncited material claims.
This adult-learning exercise uses synthetic portfolio values and paper trading only. It must not mutate runs, approvals, evaluator results, rewards, promotions, legacy challenges, or attempts.
