import os
import csv
from bs4 import BeautifulSoup, NavigableString
import re

directory = r"H:\PROYECTOS_CON_IA\CODIGOS\BLACKBOT\dentofacil\paginaweb"
files = ["index.html", "success.html", "clinicas_acceso.html", "clinicas_creditos.html", "clinicas_leads.html"]

output_csv = r"H:\PROYECTOS_CON_IA\CODIGOS\BLACKBOT\dentofacil\paginaweb\idiomas_extract.csv"

has_text = re.compile(r'[a-zA-ZáéíóúÁÉÍÓÚñÑ]')

def generate_key(text, prefix=""):
    clean = text.lower()
    clean = re.sub(r'[^a-z0-9]', '_', clean)
    clean = re.sub(r'_+', '_', clean).strip('_')
    key = clean[:30]
    return f"{prefix}{key}" if key else ""

translations = {} 
ALLOWED_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'button', 'a', 'span', 'li', 'label', 'strong', 'td', 'th', 'title']
EXCLUDE_CLASSES = ['fa-solid', 'fa-brands', 'fa-regular']

for filename in files:
    filepath = os.path.join(directory, filename)
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()
    
    soup = BeautifulSoup(html, 'html.parser')
    prefix = filename.split('.')[0] + "_"

    for tag in soup.find_all(True):
        if tag.name not in ALLOWED_TAGS and tag.name not in ['input', 'textarea']:
            continue
            
        classes = tag.get('class', [])
        if any(c in EXCLUDE_CLASSES for c in classes):
            continue

        if tag.name in ['input', 'textarea']:
            ph = tag.get('placeholder')
            if ph and has_text.search(ph) and not tag.has_attr('data-i18n'):
                key = generate_key(ph, prefix)
                if key:
                    tag['data-i18n'] = key
                    translations[key] = ph.strip()
            continue
            
        if tag.has_attr('data-i18n'):
            continue
            
        # Is this tag simple enough? (meaning no block tags inside)
        block_tags = ['div', 'p', 'ul', 'li', 'section', 'article', 'h1', 'h2', 'h3', 'button', 'a']
        has_block_child = any(child.name in block_tags for child in tag.children if getattr(child, 'name', None))
        
        # If it has block children and it is not a block itself that only has inline things
        # e.g a button with a <span> inside is fine. A <p> with <a> is fine.
        
        # we check its own text versus combined text
        combined_text = tag.get_text(separator=' ', strip=True)
        if combined_text and has_text.search(combined_text) and not has_block_child:
            # simple element, safe to apply data-i18n directly to tag
            key = generate_key(combined_text, prefix)
            if key:
                tag['data-i18n'] = key
                
                # To extract the translation, we want the HTML of the inner tags so formatting (like spans and i) is kept
                inner_html = "".join(str(c) for c in tag.contents).strip()
                translations[key] = inner_html

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(str(soup))

with open(output_csv, 'w', newline='', encoding='utf-8') as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(["ETIQUETA", "ES", "EN", "FR", "PT"])
    for k, v in translations.items():
        v_clean = re.sub(r'\s+', ' ', v).strip()
        writer.writerow([k, v_clean, "", "", ""])

print(f"Done extracting {len(translations)} keys with BS4.")
