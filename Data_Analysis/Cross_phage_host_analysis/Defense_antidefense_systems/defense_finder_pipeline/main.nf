params.genome = "../Phage_proteomes/test/*.faa"
params.entity = "phage"
params.outdir = "test"
params.threads = 2
params.conda = "/miniconda3/envs/DefenseFinder"

workflow{

    pairs_ch = channel.fromFilePairs((params.genome), size: -1, checkIfExists: true)

    if (params.entity == "host"){
        DEFENSE_FINDER(pairs_ch)
    }
    else if (params.entity == "phage"){
        ANTIDEFENSE_FINDER(pairs_ch)
    }

}


process DEFENSE_FINDER {

    conda "${params.conda}"

    tag "Searching defense and anti-defense systems for ${sampleID}"
    publishDir "$params.outdir", pattern: "*.tsv", mode: 'copy'

    input:
    tuple val(sampleID), path(genome)

    output:
    val sampleID, emit: sampleID
    path "${sampleID}_defense_finder_systems.tsv", emit: systems
    path "${sampleID}_defense_finder_genes.tsv", emit: genes
    path "${sampleID}_defense_finder_hmmer.tsv", emit: hmmer

    script:
    """
    export TMPDIR=/beegfs/HPCscratch/schauerm
    defense-finder run -a -w $params.threads \
        -o . \
        $genome
    
    rm -rf /beegfs/HPCscratch/schauerm/*
    """

}

process ANTIDEFENSE_FINDER {

    conda "${params.conda}"

    tag "Searching anti-defense systems for ${sampleID}"
    publishDir "$params.outdir", pattern: "*.tsv", mode: 'copy'

    input:
    tuple val(sampleID), path(genome)

    output:
    val sampleID, emit: sampleID
    path "${sampleID}_defense_finder_systems.tsv", emit: systems
    path "${sampleID}_defense_finder_genes.tsv", emit: genes
    path "${sampleID}_defense_finder_hmmer.tsv", emit: hmmer

    script:
    """
    export TMPDIR=/home/schauerm/tmp
    defense-finder run -A -w $params.threads \
        -o . \
        $genome
    rm -rf /beegfs/HPCscratch/schauerm/tmp/*
    """

}
