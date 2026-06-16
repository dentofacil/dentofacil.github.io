import csv

input_csv = r"H:\PROYECTOS_CON_IA\CODIGOS\BLACKBOT\dentofacil\paginaweb\idiomas_extract.csv"
output_csv = r"H:\PROYECTOS_CON_IA\CODIGOS\BLACKBOT\dentofacil\paginaweb\idiomas_extract_formatted.csv"

# Read existing records
records = []
with open(input_csv, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)
    for row in reader:
        if len(row) > 0:
            records.append(row)

# Group by page Prefix
groups = {
    "INDEX.HTML (Wizard Público)": [],
    "SUCCESS.HTML (Página de Éxito)": [],
    "CLINICAS_ACCESO.HTML (Intranet B2B / Login)": [],
    "CLINICAS_LEADS.HTML (Panel Principal de Dentistas)": [],
    "CLINICAS_CREDITOS.HTML (Pasarela B2B)": []
}

for row in records:
    key = row[0]
    if key.startswith('index_'):
        groups["INDEX.HTML (Wizard Público)"].append(row)
    elif key.startswith('success_'):
        groups["SUCCESS.HTML (Página de Éxito)"].append(row)
    elif key.startswith('clinicas_acceso_'):
        groups["CLINICAS_ACCESO.HTML (Intranet B2B / Login)"].append(row)
    elif key.startswith('clinicas_leads_'):
        groups["CLINICAS_LEADS.HTML (Panel Principal de Dentistas)"].append(row)
    elif key.startswith('clinicas_creditos_'):
        groups["CLINICAS_CREDITOS.HTML (Pasarela B2B)"].append(row)
    else:
        # Fallback or global
        groups["INDEX.HTML (Wizard Público)"].append(row)

with open(input_csv, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(header)
    
    for page, rows in groups.items():
        if not rows: continue
        
        # Add separator
        writer.writerow([])
        writer.writerow([f"PÁGINA: {page}", "", "", "", ""])
        writer.writerow(["--------------------------------------------------------------------------------", "", "", "", ""])
        
        for row in rows:
            writer.writerow(row)

print("Formatted CSV successfully.")
