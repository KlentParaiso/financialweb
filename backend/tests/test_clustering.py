"""
Tests for spending behavior clustering service.
"""

import pytest

from app.services.clustering import (
    _extract_features_from_payload,
    _build_feature_matrix,
    compute_clusters,
    FEATURE_KEYS,
)


def test_extract_features_from_payload():
    payload = {
        "income": {"monthly_net_income": 50_000},
        "expenses": {
            "rent": 15_000,
            "food": 8_000,
            "transport": 4_000,
            "discretionary": 3_000,
            "subscriptions": 500,
        },
        "debt": {"items": [{"monthly_payment": 5_000}]},
        "savings": {"monthly_savings": 10_000},
    }
    feat = _extract_features_from_payload(payload)
    assert feat is not None
    assert len(feat) == 7
    assert feat[0] == 0.30   # rent 15k/50k
    assert feat[6] == 0.20   # savings 10k/50k
    assert feat[5] == 0.10  # debt 5k/50k


def test_extract_features_returns_none_for_zero_income():
    payload = {"income": {"monthly_net_income": 0}, "expenses": {}}
    assert _extract_features_from_payload(payload) is None


def test_build_feature_matrix():
    assessments = [
        {"payload": {"income": {"monthly_net_income": 40_000}, "expenses": {"rent": 12_000}, "debt": {"items": []}, "savings": {"monthly_savings": 4_000}}},
        {"payload": {"income": {"monthly_net_income": 60_000}, "expenses": {"rent": 18_000}, "debt": {"items": []}, "savings": {"monthly_savings": 12_000}}},
    ]
    X = _build_feature_matrix(assessments)
    assert X.shape[0] == 2
    assert X.shape[1] == len(FEATURE_KEYS)


def test_compute_clusters_returns_message_when_insufficient_data():
    result = compute_clusters([], n_clusters=5)
    assert "message" in result
    assert "Not enough" in result["message"]
    assert result["clusters"] == []


def test_compute_clusters_returns_aggregates_only_no_individuals():
    assessments = [
        {"payload": {"income": {"monthly_net_income": 50_000}, "expenses": {"rent": 15_000, "food": 8_000}, "debt": {"items": []}, "savings": {"monthly_savings": 10_000}}}
        for _ in range(10)
    ]
    result = compute_clusters(assessments, n_clusters=4)
    assert result["count"] == 10
    assert result["n_clusters"] == 4
    # With identical rows, all may land in one cluster; we get at least 1, at most n_clusters
    assert 1 <= len(result["clusters"]) <= 4
    assert "aggregates" in result
    assert "total_assessments" in result["aggregates"]
    assert "overall_mean_features_pct" in result["aggregates"]
    assert "feature_descriptions" in result["aggregates"]
    for c in result["clusters"]:
        assert "cluster_id" in c
        assert "label" in c
        assert "count" in c
        assert "mean_features_pct" in c
        assert set(c["mean_features_pct"].keys()) == set(FEATURE_KEYS)
        assert isinstance(c["label"], str)
        assert len(c["label"]) > 0
    # Privacy: no individual records
    assert "assessments" not in result
    assert "records" not in result
    assert "ids" not in result


def test_compute_clusters_labels_are_human_readable():
    # Build diverse assessments so we get different clusters
    assessments = []
    for i in range(15):
        base = 40_000 + i * 2000
        assessments.append({
            "payload": {
                "income": {"monthly_net_income": base},
                "expenses": {
                    "rent": base * (0.2 + (i % 3) * 0.1),
                    "food": base * 0.2,
                    "transport": base * 0.1,
                    "discretionary": base * (0.05 + (i % 2) * 0.15),
                    "subscriptions": base * 0.02,
                },
                "debt": {"items": [{"monthly_payment": base * (0.1 if i % 4 == 0 else 0)}]},
                "savings": {"monthly_savings": base * (0.1 + (i % 2) * 0.1)},
            }
        })
    result = compute_clusters(assessments, n_clusters=5)
    labels = [c["label"] for c in result["clusters"]]
    expected_labels = {"Debt Juggler", "Lifestyle Upgrader", "Family Provider", "Stable Planner", "Budget Conscious", "Building Up"}
    for lb in labels:
        assert lb in expected_labels
