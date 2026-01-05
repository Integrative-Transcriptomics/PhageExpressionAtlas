params.protein = "/ceph/ibmi/it/projects/ML_BI/06_PhageExpressionAtlas/Use_cases/2025-11_defense_systems/Phage_proteomes/*.faa"
params.outdir = "Pharokka_proteins_phages_out"
params.db_dir = "/ceph/ibmi/it/projects/ML_BI/06_PhageExpressionAtlas/2025-12_final_database/2025-12_reannotation_phage_genomes/pharokka_protein_pipeline/database/pharokka_v1.8.0_databases"
params.threads = 4
params.conda = "/ceph/ibmi/it/projects/ML_BI/Mamba/envs/Pharokka"

workflow{

    fasta_ch = channel.fromPath(params.protein)
                      .map { file -> tuple(file.baseName, file)}
    RUN_PHAROKKA(fasta_ch)

}


process RUN_PHAROKKA {

    conda "${params.conda}"

    tag "${sampleID}"
    publishDir "$params.outdir", mode: 'copy', pattern: "${sampleID}_out/pharokka_proteins_full_merged_output.tsv"

    input:
    tuple val(sampleID), path(protein)

    output:
    tuple val(sampleID), path("${sampleID}_out/pharokka_proteins_full_merged_output.tsv"), emit: annotate
    
    script:
    """
    export TMPDIR=/beegfs/HPCscratch/schauerm

    pharokka_proteins.py \
        -i $protein \
        -o "${sampleID}_out" \
        -d $params.db_dir \
        -t $params.threads
        
    rm -rf /beegfs/HPCscratch/schauerm/*
    """

}
