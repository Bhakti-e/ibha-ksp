"""
Network Endpoint for Ibha
--------------------------
Provides criminal network graph visualization.
Shows connections between accused persons and cases.
"""

import json
from lib.auth_utils import require_auth
from lib.logging_utils import log_info, log_error
from lib import db
from lib import query_builder


def handler(request):
    """
    GET /network/accused/{person_id}
    
    Returns criminal network graph centered on a specific accused person.
    Shows:
    - Central accused person
    - All cases they're involved in
    - Other accused persons in those cases (co-accused)
    
    Path params:
        - person_id: AccusedMasterID to center the graph on
    
    Returns:
        {
            "nodes": [
                {
                    "data": {
                        "id": str,
                        "label": str,
                        "type": "person"|"case",
                        "age": int (optional),
                        "is_central": bool,
                        "crime_type": str (for cases),
                        "description": str
                    }
                }
            ],
            "edges": [
                {
                    "data": {
                        "id": str,
                        "source": str,
                        "target": str,
                        "relationship": "ACCUSED_IN"|"CO_ACCUSED",
                        "case_id": str (optional)
                    }
                }
            ],
            "central_person_id": str,
            "metadata": {
                "total_nodes": int,
                "total_edges": int,
                "cases_count": int
            }
        }
    """
    try:
        # Authenticate
        try:
            user_claims = require_auth(request)
        except ValueError as e:
            return {
                "statusCode": 401,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": str(e)})
            }
        
        # Extract person_id from path
        path = request.get("path", "") if hasattr(request, 'get') else ""
        path_params = request.get("pathParameters", {}) if hasattr(request, 'get') else {}
        
        # Try to get person_id from path parameters or parse from path
        person_id = path_params.get("person_id")
        
        if not person_id and "/accused/" in path:
            # Extract from path like /network/accused/1
            parts = path.split("/accused/")
            if len(parts) > 1:
                person_id = parts[1].split("/")[0].split("?")[0]
        
        if not person_id:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "person_id is required"})
            }
        
        log_info("Network request", {
            "user_id": user_claims["user_id"],
            "role": user_claims["role"],
            "person_id": person_id
        })
        
        # Build and execute query
        sql, query_params = query_builder.build_network_query(person_id)
        
        try:
            raw_data = db.execute_query(sql, query_params)
        except Exception as db_error:
            log_error("Failed to fetch network", {"error": str(db_error)}, db_error)
            return {
                "statusCode": 500,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "Database error"})
            }
        
        if not raw_data:
            return {
                "statusCode": 404,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "Person not found or no network data available"})
            }
        
        # Build graph structure
        nodes = []
        edges = []
        person_nodes_seen = set()
        case_nodes_seen = set()
        
        central_person_name = None
        
        for row in raw_data:
            accused_id = str(row.get("accused_id", ""))
            accused_name = row.get("name", "Unknown")
            accused_age = row.get("age")
            case_id = str(row.get("case_id", ""))
            case_number = row.get("case_number", "Unknown")
            case_description = row.get("case_description", "")
            crime_type = row.get("crime_type", "Unknown")
            
            # Track central person
            if accused_id == str(person_id):
                central_person_name = accused_name
            
            # Add person node (if not already added)
            if accused_id not in person_nodes_seen:
                nodes.append({
                    "data": {
                        "id": f"person_{accused_id}",
                        "label": accused_name,
                        "type": "person",
                        "age": accused_age,
                        "is_central": (accused_id == str(person_id)),
                        "description": f"Age: {accused_age}" if accused_age else "Age unknown"
                    }
                })
                person_nodes_seen.add(accused_id)
            
            # Add case node (if not already added)
            if case_id not in case_nodes_seen:
                nodes.append({
                    "data": {
                        "id": f"case_{case_id}",
                        "label": case_number,
                        "type": "case",
                        "crime_type": crime_type,
                        "description": case_description[:100] + "..." if len(case_description) > 100 else case_description
                    }
                })
                case_nodes_seen.add(case_id)
            
            # Add edge: Person ACCUSED_IN Case
            edges.append({
                "data": {
                    "id": f"edge_{accused_id}_{case_id}",
                    "source": f"person_{accused_id}",
                    "target": f"case_{case_id}",
                    "relationship": "ACCUSED_IN",
                    "case_id": case_id
                }
            })
        
        # Add CO_ACCUSED edges (connect accused persons who share cases)
        # Group accused by case
        case_to_accused = {}
        for row in raw_data:
            case_id = str(row.get("case_id", ""))
            accused_id = str(row.get("accused_id", ""))
            
            if case_id not in case_to_accused:
                case_to_accused[case_id] = []
            case_to_accused[case_id].append(accused_id)
        
        # Create CO_ACCUSED edges
        co_accused_edges_seen = set()
        for case_id, accused_list in case_to_accused.items():
            if len(accused_list) > 1:
                # Connect all pairs of accused in this case
                for i, accused_1 in enumerate(accused_list):
                    for accused_2 in accused_list[i+1:]:
                        # Create bidirectional edge key (sorted to avoid duplicates)
                        edge_key = tuple(sorted([accused_1, accused_2]))
                        
                        if edge_key not in co_accused_edges_seen:
                            edges.append({
                                "data": {
                                    "id": f"edge_co_{accused_1}_{accused_2}",
                                    "source": f"person_{accused_1}",
                                    "target": f"person_{accused_2}",
                                    "relationship": "CO_ACCUSED",
                                    "case_id": case_id
                                }
                            })
                            co_accused_edges_seen.add(edge_key)
        
        metadata = {
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "cases_count": len(case_nodes_seen),
            "persons_count": len(person_nodes_seen)
        }
        
        log_info("Network retrieved", metadata)
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "nodes": nodes,
                "edges": edges,
                "central_person_id": str(person_id),
                "central_person_name": central_person_name,
                "metadata": metadata
            })
        }
    
    except Exception as e:
        log_error("Network endpoint error", {"error": str(e)}, e)
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "Internal server error"})
        }
