from Bio import SeqIO, Entrez
from Bio.Seq import Seq
from Bio.SeqRecord import SeqRecord
import argparse
import tempfile
import os
import time

Entrez.email = "maik.wolfram-schauerte@uni-tuebingen.de"

def main():
    start = time.time()
    parser = argparse.ArgumentParser()
    parser.add_argument('-i', '--input', required=True, help="Text file with NCBI accession IDs (one per line)")
    parser.add_argument('-o', '--output_dir', required=True, help="Directory to save individual protein FASTA files")
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)

    with open(args.input) as id_file:
        accessions = [line.strip() for line in id_file if line.strip()]

    for acc in accessions:
        write_proteins_for_accession(acc, args.output_dir)

    end = time.time()
    print(f"\nDone in {(end - start)/60:.2f} minutes")

# Fetch GenBank file from Entrez
def fetch_genbank_file(accession):
    try:
        handle = Entrez.efetch(db="nuccore", id=accession, rettype="gbwithparts", retmode="text")
        time.sleep(3)
        gb_record = handle.read()
        handle.close()

        with tempfile.NamedTemporaryFile(mode="w+", delete=False, suffix=".gb") as gb_file:
            gb_file.write(gb_record)
            return gb_file.name

    except Exception as e:
        print(f"Error fetching {accession}: {e}")
        return None

# Extract proteins from CDS features using the 'translation' qualifier
def extract_proteins_from_genbank(gb_file):
    record = SeqIO.read(gb_file, "genbank")
    proteins = []

    for feature in record.features:
        if feature.type != "CDS":
            continue

        qualifiers = feature.qualifiers
        if "translation" not in qualifiers:
            continue  # Skip if no protein translation is available
        
        start = int(feature.location.start)
        protein_seq = qualifiers["translation"][0]
        gene_name = f"gene-{qualifiers.get('locus_tag', qualifiers.get('gene', ['unknown']))[0]}"
        header = gene_name.replace(' ', '_')  # Removed record.id prefix
        proteins.append((start, header, protein_seq))
    
    proteins.sort(key=lambda x: x[0])

    return proteins

# Write individual FASTA file for each accession
def write_proteins_for_accession(accession, output_dir):
    gb_file = fetch_genbank_file(accession)
    if not gb_file:
        return

    protein_entries = extract_proteins_from_genbank(gb_file)

    if not protein_entries:
        print(f"No proteins found for {accession}")
        os.remove(gb_file)
        return

    output_file = os.path.join(output_dir, f"{accession}.faa")

    with open(output_file, "w") as handle:
        for _, header, protein_seq in protein_entries:
            handle.write(f">{header}\n")
            for i in range(0, len(protein_seq), 70):
                handle.write(protein_seq[i:i+70] + "\n")
            handle.write("\n")

    print(f"Saved {len(protein_entries)} proteins for {accession} → {output_file}")
    os.remove(gb_file)

if __name__ == "__main__":
    main()