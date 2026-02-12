from fastapi import APIRouter, Depends, HTTPException
import pandas as pd
import numpy as np
import os
import math
import json
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

EXCEL_PATH = "data_imports/Servicios.xlsx"

def clean_for_json(obj):
    """Recursively clean data for JSON serialization"""
    if isinstance(obj, dict):
        return {k: clean_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_for_json(item) for item in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    elif isinstance(obj, (np.integer, np.floating)):
        val = float(obj)
        if math.isnan(val) or math.isinf(val):
            return None
        return val
    elif isinstance(obj, np.ndarray):
        return clean_for_json(obj.tolist())
    elif pd.isna(obj):
        return None
    else:
        return obj

@router.get("/servicios-excel")
async def get_servicios_excel(
    current_user: User = Depends(get_current_user),
    start_date: str = None,
    end_date: str = None
):
    """Read and aggregate 'Servicios.xlsx' for SETTEPI MONTERREY with date filtering fragmentation"""
    if not os.path.exists(EXCEL_PATH):
        raise HTTPException(status_code=404, detail="Excel file not found")
    
    try:
        # Read excel
        df = pd.read_excel(EXCEL_PATH)
        
        # Clean column names (strip whitespace)
        df.columns = [c.strip() for c in df.columns]
        
        # Filter for SETTEPI MONTERREY
        filtered_df = df[df['TIPO Gpo.'] == 'SETTEPI MONTERREY'].copy()
        
        # Convert FECHA to datetime
        if 'FECHA' in filtered_df.columns:
            filtered_df['FECHA'] = pd.to_datetime(filtered_df['FECHA'], errors='coerce')
            filtered_df['FECHA_STR'] = filtered_df['FECHA'].apply(lambda x: x.strftime('%Y-%m-%d') if pd.notnull(x) else None)
        
        # Apply Date Filters
        if start_date:
            try:
                start_dt = pd.to_datetime(start_date)
                filtered_df = filtered_df[filtered_df['FECHA'] >= start_dt]
            except Exception:
                pass
        
        if end_date:
            try:
                end_dt = pd.to_datetime(end_date)
                if len(end_date) <= 10: 
                    end_dt = end_dt + pd.Timedelta(days=1, microseconds=-1)
                filtered_df = filtered_df[filtered_df['FECHA'] <= end_dt]
            except Exception:
                pass

        # 1. Basic Stats
        total_records = int(len(filtered_df))
        total_importe = float(filtered_df['IMPORTE.'].sum()) if 'IMPORTE.' in filtered_df.columns else 0.0
        if math.isnan(total_importe) or math.isinf(total_importe):
            total_importe = 0.0
        avg_efficiency = float(filtered_df['EFICIENCIA'].mean()) if 'EFICIENCIA' in filtered_df.columns else 0.0
        if math.isnan(avg_efficiency) or math.isinf(avg_efficiency):
            avg_efficiency = 0.0
        
        # 2. Services by Type
        services_by_type = {}
        if 'SERVICIO' in filtered_df.columns:
            for k, v in filtered_df['SERVICIO'].value_counts().items():
                if pd.notna(k):
                    services_by_type[str(k)] = int(v)

        # 3. Top Units by Cost (ECO)
        top_units_cost = []
        if 'ECO.' in filtered_df.columns and 'IMPORTE.' in filtered_df.columns:
            grp = filtered_df.groupby('ECO.')['IMPORTE.'].sum().sort_values(ascending=False).head(10)
            for k, v in grp.items():
                eco_val = str(int(k)) if pd.notna(k) else "N/A"
                imp_val = float(v) if pd.notna(v) and not math.isinf(v) else 0.0
                top_units_cost.append({"ECO": eco_val, "IMPORTE": imp_val})

        # 4. Efficiency by Workshop
        efficiency_by_taller = []
        if 'TALLER' in filtered_df.columns and 'EFICIENCIA' in filtered_df.columns:
            grp = filtered_df.groupby('TALLER')['EFICIENCIA'].mean().sort_values(ascending=False).head(10)
            for k, v in grp.items():
                taller_val = str(k) if pd.notna(k) else "N/A"
                eff_val = float(v) if pd.notna(v) and not math.isinf(v) else 0.0
                efficiency_by_taller.append({"TALLER": taller_val, "EFICIENCIA": eff_val})

        # 5. Monthly Trend (spending per month)
        monthly_trend = []
        if 'FECHA' in filtered_df.columns and 'IMPORTE.' in filtered_df.columns:
            temp_df = filtered_df.copy()
            temp_df['MONTH'] = temp_df['FECHA'].dt.to_period('M')
            grp = temp_df.groupby('MONTH').agg({
                'IMPORTE.': 'sum',
                'EFICIENCIA': 'mean'
            }).reset_index()
            grp = grp.sort_values('MONTH').tail(12)  # Last 12 months
            for _, row in grp.iterrows():
                month_str = str(row['MONTH']) if pd.notna(row['MONTH']) else 'N/A'
                monthly_trend.append({
                    "month": month_str,
                    "importe": float(row['IMPORTE.']) if pd.notna(row['IMPORTE.']) and not math.isinf(row['IMPORTE.']) else 0.0,
                    "efficiency": float(row['EFICIENCIA']) if pd.notna(row['EFICIENCIA']) and not math.isinf(row['EFICIENCIA']) else 0.0
                })

        # 6. Cost by Service Type
        cost_by_service = []
        if 'SERVICIO' in filtered_df.columns and 'IMPORTE.' in filtered_df.columns:
            grp = filtered_df.groupby('SERVICIO')['IMPORTE.'].sum().sort_values(ascending=False)
            for k, v in grp.items():
                if pd.notna(k):
                    cost_by_service.append({
                        "service": str(k),
                        "cost": float(v) if pd.notna(v) and not math.isinf(v) else 0.0
                    })

        # 7. Unique units count
        unique_units = 0
        if 'ECO.' in filtered_df.columns:
            unique_units = int(filtered_df['ECO.'].nunique())

        # 8. Recent Records (for table)
        records_df = filtered_df.head(100).copy()
        
        # Convert to simple Python types
        records = []
        for _, row in records_df.iterrows():
            record = {}
            for col in records_df.columns:
                val = row[col]
                if pd.isna(val):
                    record[col] = None
                elif isinstance(val, (np.integer)):
                    record[col] = int(val)
                elif isinstance(val, (np.floating, float)):
                    if math.isnan(val) or math.isinf(val):
                        record[col] = None
                    else:
                        record[col] = float(val)
                elif hasattr(val, 'strftime'):
                    record[col] = val.strftime('%Y-%m-%d')
                else:
                    record[col] = str(val) if val is not None else None
            records.append(record)
        
        result = {
            "summary": {
                "total_records": total_records,
                "total_importe": total_importe,
                "avg_efficiency": avg_efficiency,
                "services_by_type": services_by_type,
                "top_units_cost": top_units_cost,
                "efficiency_by_taller": efficiency_by_taller,
                "monthly_trend": monthly_trend,
                "cost_by_service": cost_by_service,
                "unique_units": unique_units
            },
            "data": records
        }

        
        return result
        
    except Exception as e:
        print(f"Error reading excel: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


LLANTAS_PATH = "data_imports/Llantas.xlsx"

def parse_tire_value(value):
    """Parse tire measurement value, removing letters and extracting number"""
    if pd.isna(value) or value is None:
        return None
    
    # Convert to string and strip
    val_str = str(value).strip()
    
    if not val_str:
        return None
    
    # Remove letters (Q, M, C, P, etc) and extract number
    import re
    numbers = re.findall(r'[\d.]+', val_str)
    
    if numbers:
        try:
            return float(numbers[0])
        except:
            return None
    return None

def get_tire_status(mm_value):
    """Get status based on millimeters: <=4 critical (red), 5-6 warning (yellow), >6 good (green)"""
    if mm_value is None:
        return {"status": "unknown", "color": "#94a3b8", "label": "N/A"}
    
    if mm_value <= 4:
        return {"status": "critical", "color": "#ef4444", "label": "Crítico"}
    elif mm_value <= 6:
        return {"status": "warning", "color": "#f59e0b", "label": "Atención"}
    else:
        return {"status": "good", "color": "#22c55e", "label": "Bueno"}

@router.get("/llantas-excel")
async def get_llantas_excel(
    current_user: User = Depends(get_current_user),
    cuenta: str = None
):
    """Read Llantas.xlsx and return tire data with status calculations"""
    if not os.path.exists(LLANTAS_PATH):
        raise HTTPException(status_code=404, detail="Archivo de llantas no encontrado")
    
    try:
        # Read excel
        df = pd.read_excel(LLANTAS_PATH)
        
        # Clean column names (strip whitespace)
        df.columns = [str(c).strip() for c in df.columns]
        
        # Find the cuenta/account column (might be "cuenta individual" or similar)
        cuenta_col = None
        for col in df.columns:
            if 'cuenta' in col.lower():
                cuenta_col = col
                break
        
        # Apply filter if cuenta is specified
        if cuenta and cuenta_col:
            df = df[df[cuenta_col].astype(str).str.strip() == cuenta.strip()]
        
        # Get unique cuentas for filter dropdown
        unique_cuentas = []
        if cuenta_col:
            original_df = pd.read_excel(LLANTAS_PATH)
            original_df.columns = [str(c).strip() for c in original_df.columns]
            unique_cuentas = sorted([str(x).strip() for x in original_df[cuenta_col].dropna().unique()])
        
        # Process each row
        results = []
        
        # Identify position columns (pos1, pos2, etc.)
        pos_columns = [col for col in df.columns if col.lower().startswith('pos')]
        
        for _, row in df.iterrows():
            # Get basic info
            fecha = row.get('Fecha', None)
            if hasattr(fecha, 'strftime'):
                fecha = fecha.strftime('%Y-%m-%d')
            elif pd.notna(fecha):
                fecha = str(fecha)
            else:
                fecha = None
            
            placa = str(row.get('Placa', '')) if pd.notna(row.get('Placa')) else ''
            eco_sap = str(row.get('ID/ECO/SAP', '')) if pd.notna(row.get('ID/ECO/SAP')) else ''
            cuenta_val = str(row.get(cuenta_col, '')) if cuenta_col and pd.notna(row.get(cuenta_col)) else ''
            
            # Process tire positions
            tires = {}
            for pos_col in pos_columns:
                raw_value = row.get(pos_col)
                mm_value = parse_tire_value(raw_value)
                status_info = get_tire_status(mm_value)
                
                pos_num = pos_col.lower().replace('pos', '').strip()
                
                tires[pos_col] = {
                    "raw": str(raw_value) if pd.notna(raw_value) else None,
                    "mm": mm_value,
                    "status": status_info["status"],
                    "color": status_info["color"],
                    "label": status_info["label"]
                }
            
            # Calculate overall unit status (worst tire determines status)
            overall_status = "good"
            critical_count = 0
            warning_count = 0
            
            for pos, tire_data in tires.items():
                if tire_data["status"] == "critical":
                    critical_count += 1
                    overall_status = "critical"
                elif tire_data["status"] == "warning":
                    warning_count += 1
                    if overall_status != "critical":
                        overall_status = "warning"
            
            results.append({
                "fecha": fecha,
                "placa": placa,
                "eco_sap": eco_sap,
                "cuenta": cuenta_val,
                "tires": tires,
                "overall_status": overall_status,
                "critical_count": critical_count,
                "warning_count": warning_count
            })
        
        # Sort by status priority (critical first)
        status_priority = {"critical": 0, "warning": 1, "good": 2, "unknown": 3}
        results.sort(key=lambda x: status_priority.get(x["overall_status"], 3))
        
        # Summary stats
        total = len(results)
        critical_units = sum(1 for r in results if r["overall_status"] == "critical")
        warning_units = sum(1 for r in results if r["overall_status"] == "warning")
        good_units = sum(1 for r in results if r["overall_status"] == "good")
        
        return {
            "summary": {
                "total": total,
                "critical": critical_units,
                "warning": warning_units,
                "good": good_units
            },
            "cuentas": unique_cuentas,
            "data": results
        }
        
    except Exception as e:
        print(f"Error reading llantas excel: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
