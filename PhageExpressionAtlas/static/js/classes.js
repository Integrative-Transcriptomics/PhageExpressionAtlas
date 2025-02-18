
/*
This file contains internal classes for javascript according to the python classes in models.py
*/

class Dataset {
    /**
     * @param {number} id
     * @param {string} phageID
     * @param {string} phageName
     * @param {string} hostID
     * @param {string} hostName
     * @param {string} hostGroup
     * @param {any} matrixData
     * @param {string} normalization
     * @param {string} source
     * @param {string} journal
     * @param {number} year
     * @param {string} firstAuthor
     * @param {string} pubmedID
     * @param {string} description
     * @param {string} doi
     */
    constructor(source, id, phageID, phageName, hostID, hostName, hostGroup, matrixData = null, normalization,  journal, year, firstAuthor, pubmedID, description, doi){
        this.source = source;
        this.id = id;
        this.phageID = phageID;
        this.phageName = phageName;
        this.hostID = hostID;
        this.hostName = hostName;
        this.hostGroup = hostGroup;
        this.matrixData = matrixData;
        this.normalization = normalization;
        this.journal = journal;
        this.year = year;
        this.firstAuthor = firstAuthor;
        this.pubmedID = pubmedID;
        this.description = description;
        this.doi = doi;
    }
}

class MatrixData {
    /**
     * @param {string} geneID
     * @param {number[]} values
     * @param {string} entity
     * @param {string} symbol
     */
    constructor(geneID, values, entity, symbol) {
        this.geneID = geneID; 
        this.values = values; 
        this.entity = entity;  
        this.symbol = symbol;  
    }

    static fromJSON(json) {
        const { Geneid, Entity, Symbol, ...valueFields } = json; // Extract fields

        // Convert only the numeric keys to an array of values
        const values = Object.keys(valueFields)
            .filter(key => !isNaN(key)) // Keep only numeric keys
            .sort((a, b) => a - b) // Sort keys numerically
            .map(key => valueFields[key]); // Extract values

        return new MatrixData(Geneid, values, Entity, Symbol);
    }

}



class Phage {
    /**
     * @param {number} id
     * @param {string} name
     * @param {string} description
     * @param {string} ncbiID
     * @param {string} phageType
     * @param {Dataset[]} datasets
     * @param {any[]} gffFiles
     */
    constructor(id, name, description, ncbiID, phageType, datasets = [], gffFiles = []) {
        this.id = id;
        this.name = name;
        this.description = description; 
        this.ncbiId = ncbiID;
        this.phageType = phageType;  

        // relationships: arrays to hold related datasets and gff files
        this.datasets = datasets;
        this.gffFiles = gffFiles;
    }

    // add a Dataset to this Phage's dataset list
    addDataset(dataset) {
        this.datasets.push(dataset);
    }

    // add a GFF file to this Phage's gff_files list
    addGffFile(gffFile) {
        this.gffFiles.push(gffFile);
    }
}

class Host{
    /**
     * @param {number} id
     * @param {string} name
     * @param {string} description
     * @param {string} ncbiID
     * @param {Dataset[]} datasets
     * @param {any[]} gffFiles
     */
    constructor(id, name, description, ncbiID, datasets = [], gffFiles = []) {
        this.id = id;
        this.name = name;
        this.description = description; 
        this.ncbiId = ncbiID;

        // relationships: arrays to hold related datasets and gff files
        this.datasets = datasets;
        this.gffFiles = gffFiles;
    }

    // add a Dataset to this Phage's dataset list
    addDataset(dataset) {
        this.datasets.push(dataset);
    }

    // add a GFF file to this Phage's gff_files list
    addGffFile(gffFile) {
        this.gffFiles.push(gffFile);
    }
}

class PhageGenome{
    /**
     * @param {number} id
     * @param {string} name
     * @param {string} phageID
     * @param {any} gffData
     */
    constructor(id, name, phageID, gffData){
        this.id = id,
        this.name = name,
        this.phageID = phageID,
        this.gffData = gffData

    }
}

class HostGenome{
    /**
     * @param {number} id
     * @param {string} name
     * @param {string} hostID
     * @param {any} gffData
     */
    constructor(id, name, hostID, gffData){
        this.id = id,
        this.name = name,
        this.hostID = hostID,
        this.gffData = gffData
    }
}

