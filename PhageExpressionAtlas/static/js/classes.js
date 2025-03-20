
/*

    Herein, are  all Classes that are used in the PhageExpressionAtlas for javascript, they are similar to the Models in models.py 

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

