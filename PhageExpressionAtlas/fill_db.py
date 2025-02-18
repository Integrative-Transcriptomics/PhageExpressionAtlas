import pandas as pd
import pickle
from init import app, db
from models import *


"""
No need to execute any elements of this code at all.
"""


## Definition of functions for filling the database
def addFullDataset(phageName, phageDes, phageID, phageType,
               hostName, hostDes, hostID, 
               rnaSeqPath, norm, name, journal, year, firstauthor, pubmedID, description,
               phageGenomePath, phageGenomeName, 
               hostGenomePath, hostGenomeName):
    
    """
    phageName, phageDes, phageID, phageType: info for the phage to be added
    hostName, hostDes, hostID: info for the host to be added
    rnaSeqPath, norm, name, journal, year, firstauthor, pubmedID: info for dual RNA-seq dataset linked to phage and host
    phageGenomePath, phageGenomeName: info about phage reference genome gff file
    hostGenomePath, hostGenomeName: info about host reference genome gff file
    """

    phageAdd = Phage(name = phageName, description = phageDes, ncbi_id = phageID, phage_type = phageType)
    hostAdd = Host(name = hostName, description = hostDes, ncbi_id = hostID)

    db.session.add(phageAdd)
    db.session.add(hostAdd)
    db.session.commit()

    countsTable = pd.read_csv(rnaSeqPath, index_col=0, sep='\t')
    countsserial = pickle.dumps(countsTable)
    rnaSeq = Dataset(matrix_data = countsserial, normalization = norm, phage_id = phageAdd.id, host_id = hostAdd.id,
                     name = name, year = year, firstauthor = firstauthor, journal = journal, pubmedID = pubmedID, description = description)

    phagegff = pd.read_csv(phageGenomePath, sep='\t', comment = '#')
    phagegenome = pickle.dumps(phagegff)
    phageGFF = PhageGenome(name = phageGenomeName, phage_id = phageAdd.id, gff_data = phagegenome)

    hostgff = pd.read_csv(hostGenomePath, sep='\t', comment = '#')
    hostgenome = pickle.dumps(hostgff)
    hostGFF = HostGenome(name = hostGenomeName, host_id = hostAdd.id, gff_data = hostgenome)


    db.session.add(rnaSeq)
    db.session.add(phageGFF)
    db.session.add(hostGFF)
    db.session.commit()

def addSingleDataset(rnaSeqPath, norm, name, journal, year, firstauthor, pubmedID, host_id, phage_id, description):
    countsTable = pd.read_csv(rnaSeqPath, index_col=0, sep='\t')
    countsserial = pickle.dumps(countsTable)
    rnaSeq = Dataset(matrix_data = countsserial, normalization = norm, phage_id = phage_id, host_id = host_id,
                     name = name, year = year, firstauthor = firstauthor, journal = journal, pubmedID = pubmedID, description = description)

    db.session.add(rnaSeq)
    db.session.commit()


## Addition of datasets (especially for documentation steps)


# Add dataset Wolfram-Schauerte_2022

description = 'Exponentially growing E. coli infected with T4 phage in biological triplicates. Samples taken before and 1, 4, 7 and 20 min post infection and analysed by stranded RNA-seq.'

with app.app_context():
    addFullDataset(phageName='T4 phage', phageDes = 'Bacteriophage T4', phageID = 'NC_000866.4', phageType = 'virulent',
               hostName = 'Escherichia coli', hostDes = 'E. coli K12 MG1655', hostID = 'U00096.3',
               rnaSeqPath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Wolfram-Schauerte_2022/Wolfram-Schauerte_fractional_expression.tsv', norm = 'fractional',
               name = 'Wolfram-Schauerte_2022', year = 2022, journal = 'Viruses', firstauthor = 'Wolfram-Schauerte', pubmedID = 36423111, description = description,
               phageGenomePath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Wolfram-Schauerte_2022/T4Genome.gff3', phageGenomeName = 'T4 phage genome',
               hostGenomePath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Wolfram-Schauerte_2022/EcoliGenome.gff3', hostGenomeName = 'E. coli genome')

# Add more datasets with different normalizations of Wolfram-Schauerte_2022
with app.app_context():
    addSingleDataset(rnaSeqPath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Wolfram-Schauerte_2022/Wolfram-Schauerte_full_TPM.tsv',
                     norm = 'TPM', name = 'Wolfram-Schauerte_2022', year = 2022, journal = 'Viruses', description = description,
                     firstauthor = 'Wolfram-Schauerte', pubmedID = 36423111, host_id=1, phage_id=1)
    addSingleDataset(rnaSeqPath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Wolfram-Schauerte_2022/Wolfram-Schauerte_TPM_means.tsv',
                     norm = 'TPM_means', name = 'Wolfram-Schauerte_2022', year = 2022, journal = 'Viruses', description = description,
                     firstauthor = 'Wolfram-Schauerte', pubmedID = 36423111, host_id=1, phage_id=1)
    addSingleDataset(rnaSeqPath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Wolfram-Schauerte_2022/Wolfram-Schauerte_TPM_std.tsv',
                     norm = 'TPM_std', name = 'Wolfram-Schauerte_2022', year = 2022, journal = 'Viruses', description = description,
                     firstauthor = 'Wolfram-Schauerte', pubmedID = 36423111, host_id=1, phage_id=1)
    

# Add datasets from Guegler 2021 referring to same phage and host as Wolfram-Schauerte 2022

description = 'E. coli induced to express toxIN (pBR322-toxIN) or not (pBR322 empty vector; -toxIN) and sampled taken before (0) or 2.5, 5, 10, 20 and 30 min post infection with bacteriophage T4. [GSE161794]'
 
with app.app_context():
    addSingleDataset(rnaSeqPath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Guegler_2021/Guegler_fractional_expression.tsv',
                     norm = 'fractional', name = 'Guegler_2021', year = 2021, journal = 'Molecular Cell', description = description,
                     firstauthor = 'Guegler', pubmedID = 33838104, host_id=1, phage_id=1)
    addSingleDataset(rnaSeqPath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Guegler_2021/Guegler_full_TPM.tsv',
                     norm = 'TPM', name = 'Guegler_2021', year = 2021, journal = 'Molecular Cell', description = description,
                     firstauthor = 'Guegler', pubmedID = 33838104, host_id=1, phage_id=1)
    addSingleDataset(rnaSeqPath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Guegler_2021/Guegler_TPM_means.tsv',
                     norm = 'TPM_means', name = 'Guegler_2021', year = 2021, journal = 'Molecular Cell', description = description,
                     firstauthor = 'Guegler', pubmedID = 33838104, host_id=1, phage_id=1)
    addSingleDataset(rnaSeqPath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Guegler_2021/Guegler_TPM_std.tsv',
                     norm = 'TPM_std', name = 'Guegler_2021', year = 2021, journal = 'Molecular Cell', description = description,
                     firstauthor = 'Guegler', pubmedID = 33838104, host_id=1, phage_id=1)


# Add dataset Finstrlova_2022

description = 'Infection of two S. aureus strains, SH1000 and Newman, with Staphylococcus virus K sampled in biological triplicates at 0, 2, 5, 10, 20, and 30 minutes after infection.'

with app.app_context():
    addFullDataset(phageName='Kayvirus phage K', phageDes = 'Staphylococcus virus K', phageID = 'NC_005880.2', phageType = 'virulent',
               hostName = 'S. aureus strain Newman', hostDes = 'Staphylococcus aureus strain Newman', hostID = 'AP009351.1',
               rnaSeqPath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Finstrlova_2022/Finstrlova_Newman_fractional_expression.tsv', norm = 'fractional',
               name = 'Finstrlova_2022_Newman', year = 2022, journal = 'Microbiology Spectrum', firstauthor = 'Finstrlova', pubmedID = 3545752, description = description,
               phageGenomePath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Finstrlova_2022/NC_005880-2.gff3', phageGenomeName = 'K virus genome',
               hostGenomePath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Finstrlova_2022/AP009351-1.gff3', hostGenomeName = 'S. aureus Newman genome')

with app.app_context():
    addSingleDataset(rnaSeqPath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Finstrlova_2022/Finstrlova_Newman_full_TPM.tsv', norm = 'TPM',
               name = 'Finstrlova_2022_Newman', year = 2022, journal = 'Microbiology Spectrum', firstauthor = 'Finstrlova', pubmedID = 3545752, description = description, host_id=2, phage_id=2)
    addSingleDataset(rnaSeqPath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Finstrlova_2022/Finstrlova_Newman_TPM_means.tsv', norm = 'TPM_means',
               name = 'Finstrlova_2022_Newman', year = 2022, journal = 'Microbiology Spectrum', firstauthor = 'Finstrlova', pubmedID = 3545752, description = description, host_id=2, phage_id=2)
    addSingleDataset(rnaSeqPath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Finstrlova_2022/Finstrlova_Newman_TPM_std.tsv', norm = 'TPM_std',
               name = 'Finstrlova_2022_Newman', year = 2022, journal = 'Microbiology Spectrum', firstauthor = 'Finstrlova', pubmedID = 3545752, description = description, host_id=2, phage_id=2)
    
with app.app_context():
    hostAdd = Host(name = 'S. aureus SH1000', description = 'Staphylococcus aureus strain SH1000', ncbi_id = 'GCA_021739435.1')
    db.session.add(hostAdd)
    db.session.commit()

with app.app_context():
    hostgff = pd.read_csv('/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Finstrlova_2022/GCA_021739435-1.gff', sep='\t', comment = '#')
    hostgenome = pickle.dumps(hostgff)
    hostGFF = HostGenome(name = 'S. aureus SH1000 genome', host_id = 3, gff_data = hostgenome)
    db.session.add(hostGFF)
    db.session.commit()

with app.app_context():
    addSingleDataset(rnaSeqPath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Finstrlova_2022/Finstrlova_SH1000_fractional_expression.tsv', norm = 'fractional',
               name = 'Finstrlova_2022_SH1000', year = 2022, journal = 'Microbiology Spectrum', firstauthor = 'Finstrlova', pubmedID = 3545752, description = description, host_id=3, phage_id=2)
    addSingleDataset(rnaSeqPath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Finstrlova_2022/Finstrlova_SH1000_full_TPM.tsv', norm = 'TPM',
               name = 'Finstrlova_2022_SH1000', year = 2022, journal = 'Microbiology Spectrum', firstauthor = 'Finstrlova', pubmedID = 3545752, description = description, host_id=3, phage_id=2)
    addSingleDataset(rnaSeqPath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Finstrlova_2022/Finstrlova_SH1000_TPM_means.tsv', norm = 'TPM_means',
               name = 'Finstrlova_2022_SH1000', year = 2022, journal = 'Microbiology Spectrum', firstauthor = 'Finstrlova', pubmedID = 3545752, description = description, host_id=3, phage_id=2)
    addSingleDataset(rnaSeqPath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Finstrlova_2022/Finstrlova_SH1000_TPM_std.tsv', norm = 'TPM_std',
               name = 'Finstrlova_2022_SH1000', year = 2022, journal = 'Microbiology Spectrum', firstauthor = 'Finstrlova', pubmedID = 3545752, description = description, host_id=3, phage_id=2)
    
# Add dataset Kuptsov_2022

description = 'Infection of S. aureus strain SA515 with Staphylococcus phage vB_SauM-515A1 sampled in biological triplicates at 5, 15 and 30 minutes after infection.'

with app.app_context():
    addFullDataset(phageName='vB_SauM-515A1 kayvirus', phageDes = 'Staphylococcus phsge vB_SauM-515A1', phageID = 'MN047438.1', phageType = 'virulent',
               hostName = 'S. aureus strain SA515', hostDes = 'Staphylococcus aureus strain SA515', hostID = 'GCA_022352045.1',
               rnaSeqPath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Kuptsov_2022/Kuptsov_fractional_expression.tsv', norm = 'fractional',
               name = 'Kuptsov_2022', year = 2022, journal = 'Viruses', firstauthor = 'Kuptsov', pubmedID = 35336974, description = description,
               phageGenomePath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Kuptsov_2022/MN047438-1.gff3', phageGenomeName = 'vB_SauM-515A1 virus genome',
               hostGenomePath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Kuptsov_2022/GCA_022352045-1.gff', hostGenomeName = 'S. aureus SA515 genome')

with app.app_context():
    addSingleDataset(rnaSeqPath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Kuptsov_2022/Kuptsov_full_TPM.tsv', norm = 'TPM',
               name = 'Kuptsov_2022', year = 2022, journal = 'Viruses', firstauthor = 'Kuptsov', pubmedID = 35336974, description = description, host_id=4, phage_id=3)
    addSingleDataset(rnaSeqPath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Kuptsov_2022/Kuptsov_TPM_means.tsv', norm = 'TPM_means',
               name = 'Kuptsov_2022', year = 2022, journal = 'Viruses', firstauthor = 'Kuptsov', pubmedID = 35336974, description = description, host_id=4, phage_id=3)
    addSingleDataset(rnaSeqPath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Kuptsov_2022/Kuptsov_TPM_std.tsv', norm = 'TPM_std',
               name = 'Kuptsov_2022', year = 2022, journal = 'Viruses', firstauthor = 'Kuptsov', pubmedID = 35336974, description = description, host_id=4, phage_id=3)
    
# Add dataset Leskinen_2016

description = 'Fresh cultures (logarythmic phase) of Yersinia enterocolitica YeO3-R1 were infected with bacteriophage R1-37. The RNA samples were taken at following time points post-infection: 0 (negative control), 2, 5, 10, 15, 21, 28, 35, 42 and 49 min.'

with app.app_context():
    addFullDataset(phageName='PhiR1-37', phageDes = 'Yersinia phage phiR1-37', phageID = 'AJ972879.2', phageType = 'virulent',
               hostName = 'Y. enterocolitica O:3', hostDes = 'Yersinia enterocolitica O:3', hostID = 'NC_017564.1',
               rnaSeqPath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Leskinen_2016/Leskinen_fractional_expression.tsv', norm = 'fractional',
               name = 'Leskinen_2016', year = 2016, journal = 'Viruses', firstauthor = 'Leskinen', pubmedID = 27110815, description = description,
               phageGenomePath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Leskinen_2016/AJ972879-2.gff3', phageGenomeName = 'PhiR1-37 virus genome',
               hostGenomePath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Leskinen_2016/NC_017564-1.gff3', hostGenomeName = 'Y. enterocolitica O:3 genome')

with app.app_context():
    addSingleDataset(rnaSeqPath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Leskinen_2016/Leskinen_full_TPM.tsv', norm = 'TPM',
               name = 'Leskinen_2016', year = 2016, journal = 'Viruses', firstauthor = 'Leskinen', pubmedID = 27110815, description = description, host_id=5, phage_id=4)
    addSingleDataset(rnaSeqPath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Leskinen_2016/Leskinen_TPM_means.tsv', norm = 'TPM_means',
               name = 'Leskinen_2016', year = 2016, journal = 'Viruses', firstauthor = 'Leskinen', pubmedID = 27110815, description = description, host_id=5, phage_id=4)
    addSingleDataset(rnaSeqPath = '/Users/maikwolfram-schauerte/Library/Mobile Documents/com~apple~CloudDocs/Masterarbeit_Caroline/Flask_with_DB/data/Leskinen_2016/Leskinen_TPM_std.tsv', norm = 'TPM_std',
               name = 'Leskinen_2016', year = 2016, journal = 'Viruses', firstauthor = 'Leskinen', pubmedID = 27110815, description = description, host_id=5, phage_id=4)