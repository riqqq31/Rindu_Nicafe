import urllib.request
import xml.etree.ElementTree as ET
import re

def extract_schema(file_id):
    url = f"https://drive.google.com/uc?id={file_id}&export=download"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            xml_content = response.read().decode('utf-8')
            
            tree = ET.fromstring(xml_content)
            
            for mxCell in tree.iter('mxCell'):
                value = mxCell.get('value', '')
                # Filter out pure visual components or empty values
                if not value: continue
                # We can strip HTML tags
                clean_value = re.sub(r'<[^>]+>', '', value)
                clean_value = clean_value.strip().replace('&nbsp;', ' ')
                
                # We are looking for table names and column definitions
                # Exclude purely structural mxCells like PK, FK
                if clean_value and clean_value not in ['PK', 'FK', 'ERD - Rindu Nicafe'] and not clean_value.isspace():
                    print(clean_value)
                    
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    extract_schema('1IIvJGYN6vMSkCiacp2hmV4QJ8cZNdc2a')
