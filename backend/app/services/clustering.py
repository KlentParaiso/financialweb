"""
Spending behavior clustering from stored assessments.

Builds normalized features (rent%, food%, transport%, etc.), clusters with
MiniBatchKMeans (4-6 clusters), and assigns human-readable labels from
centroid patterns. Privacy: only aggregate stats per cluster, no individual records.
"""

from __future__ import annotations

from typing import Any

import numpy as np
from sklearn.cluster import MiniBatchKMeans
from sklearn.preprocessing import StandardScaler

# Feature keys as % of monthly income (order must match matrix columns)
FEATURE_KEYS = [
    "rent_pct",
    "food_pct",
    "transport_pct",
    "discretionary_pct",
    "subscriptions_pct",
    "debt_payments_pct",
    "savings_pct",
]

# Labels we assign by centroid dominance (one per cluster)
CLUSTER_LABELS = [
    "Debt Juggler",       # highest debt_payments_pct
    "Lifestyle Upgrader", # highest discretionary + subscriptions
    "Family Provider",    # highest rent (housing)
    "Stable Planner",     # highest savings
    "Budget Conscious",   # balanced / lower discretionary
    "Building Up",        # fallback
]


def _extract_features_from_payload(payload: dict[str, Any]) -> list[float] | None:
    """
    From assessment payload build [rent%, food%, transport%, discretionary%,
    subscriptions%, debt_payments%, savings%] as share of monthly_income.
    Returns None if income missing or zero.
    """
    try:
        income = float(
            payload.get("income", {}).get("monthly_net_income")
            or payload.get("monthly_income")
        )
        if not income or income <= 0:
            return None
    except (TypeError, ValueError):
        return None

    expenses = payload.get("expenses") or {}
    if isinstance(expenses, dict):
        rent = float(expenses.get("rent", 0) or 0)
        food = float(expenses.get("food", 0) or 0)
        transport = float(expenses.get("transport", 0) or 0)
        discretionary = float(expenses.get("discretionary", 0) or 0)
        subscriptions = float(expenses.get("subscriptions", 0) or 0)
    else:
        rent = food = transport = discretionary = subscriptions = 0.0

    debt_items = (payload.get("debt") or {}).get("items") or []
    debt_payments = sum(float(d.get("monthly_payment", 0) or 0) for d in debt_items)

    savings = 0.0
    sav = payload.get("savings") or {}
    if isinstance(sav, dict):
        savings = float(sav.get("monthly_savings", 0) or 0)

    return [
        rent / income,
        food / income,
        transport / income,
        discretionary / income,
        subscriptions / income,
        debt_payments / income,
        savings / income,
    ]


def _build_feature_matrix(assessments: list[dict]) -> np.ndarray:
    """Build n x 7 matrix of normalized features; drop rows with invalid data."""
    rows = []
    for a in assessments:
        payload = a.get("payload") if isinstance(a.get("payload"), dict) else a
        if not payload:
            continue
        feat = _extract_features_from_payload(payload)
        if feat is not None:
            rows.append(feat)
    if not rows:
        return np.array([]).reshape(0, len(FEATURE_KEYS))
    return np.array(rows, dtype=np.float64)


def _assign_labels_to_clusters(centroids: np.ndarray) -> list[str]:
    """
    Assign one human-readable label per cluster based on centroid dominance.
    Uses a greedy assignment: assign each label to the cluster that best matches
    and has not been assigned yet.
    """
    n_clusters = centroids.shape[0]
    n_labels = min(n_clusters, len(CLUSTER_LABELS))
    # Column indices: 0=rent, 1=food, 2=transport, 3=discretionary, 4=subscriptions, 5=debt, 6=savings
    # Debt Juggler = max debt_payments (col 5)
    # Lifestyle Upgrader = max discretionary + subscriptions (3+4)
    # Family Provider = max rent (0)
    # Stable Planner = max savings (6)
    # Budget Conscious = min discretionary (3) among remaining
    # Building Up = fallback
    assigned = [False] * n_clusters
    labels = [""] * n_clusters

    def assign_best(label: str, score_per_cluster: list[float], prefer_higher: bool = True) -> bool:
        order = np.argsort(score_per_cluster)
        if not prefer_higher:
            order = order[::-1]
        for idx in order[::-1] if prefer_higher else order:
            if not assigned[idx]:
                assigned[idx] = True
                labels[idx] = label
                return True
        return False

    # 1) Debt Juggler: max debt_payments_pct
    debt_scores = centroids[:, 5].tolist()
    assign_best("Debt Juggler", debt_scores, prefer_higher=True)

    # 2) Lifestyle Upgrader: max discretionary + subscriptions
    lifestyle_scores = (centroids[:, 3] + centroids[:, 4]).tolist()
    assign_best("Lifestyle Upgrader", lifestyle_scores, prefer_higher=True)

    # 3) Family Provider: max rent
    assign_best("Family Provider", centroids[:, 0].tolist(), prefer_higher=True)

    # 4) Stable Planner: max savings
    assign_best("Stable Planner", centroids[:, 6].tolist(), prefer_higher=True)

    # 5) Budget Conscious: of remaining, min discretionary (or lowest "spendy" combo)
    assign_best("Budget Conscious", centroids[:, 3].tolist(), prefer_higher=False)

    # 6) Any still unassigned
    for i in range(n_clusters):
        if not labels[i]:
            labels[i] = "Building Up"
    return labels


def compute_clusters(
    assessments: list[dict],
    n_clusters: int = 5,
    random_state: int = 42,
) -> dict[str, Any]:
    """
    Build normalized features from assessments, run MiniBatchKMeans,
    assign labels, return cluster stats and anonymized aggregates only.
    No individual records are returned.
    """
    X = _build_feature_matrix(assessments)
    if X.shape[0] < n_clusters:
        return {
            "message": "Not enough assessments to cluster.",
            "min_assessments_required": n_clusters,
            "count": X.shape[0],
            "clusters": [],
            "aggregates": {},
        }

    n_clusters = min(n_clusters, X.shape[0], 6)
    n_clusters = max(4, n_clusters)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    kmeans = MiniBatchKMeans(
        n_clusters=n_clusters,
        random_state=random_state,
        n_init=3,
        batch_size=min(256, max(100, X.shape[0] // 4)),
    )
    labels = kmeans.fit_predict(X_scaled)
    centroids_scaled = kmeans.cluster_centers_
    centroids_original = scaler.inverse_transform(centroids_scaled)

    cluster_labels = _assign_labels_to_clusters(centroids_original)

    # Build anonymized cluster stats (count + mean features only)
    clusters_out = []
    for k in range(n_clusters):
        mask = labels == k
        count = int(np.sum(mask))
        if count == 0:
            continue
        mean_features = centroids_original[k].tolist()
        feature_means = dict(zip(FEATURE_KEYS, [round(x, 4) for x in mean_features]))
        clusters_out.append({
            "cluster_id": k,
            "label": cluster_labels[k],
            "count": count,
            "mean_features_pct": feature_means,
        })

    # Anonymized aggregate: overall mean of each feature across all assessments
    overall_means = np.mean(X, axis=0).tolist()
    aggregates = {
        "total_assessments": int(X.shape[0]),
        "overall_mean_features_pct": dict(zip(FEATURE_KEYS, [round(x, 4) for x in overall_means])),
        "feature_descriptions": {
            "rent_pct": "Rent as % of income",
            "food_pct": "Food as % of income",
            "transport_pct": "Transport as % of income",
            "discretionary_pct": "Discretionary as % of income",
            "subscriptions_pct": "Subscriptions as % of income",
            "debt_payments_pct": "Debt payments as % of income",
            "savings_pct": "Savings as % of income",
        },
    }

    return {
        "count": int(X.shape[0]),
        "n_clusters": n_clusters,
        "clusters": clusters_out,
        "aggregates": aggregates,
    }
