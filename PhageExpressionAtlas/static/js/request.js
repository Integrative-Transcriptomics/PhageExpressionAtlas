/*

 * This Page contains all requests to fetch data from the backend

*/

// ---- FUNCTIONS ------------------------------------------------------

/**
 * function to fetch and instantiate Dataset objects without Matrix Data
 * @returns {Promise<Dataset[]>} Array of Dataset objects
 */
async function fetch_pickled_datasets(){
    return axios
    .get("/fetch_pickled_datasets")
    .then( (response) => {  

        const data = response.data;
       
        const datasets_pickled = data.map(data => 
            new Dataset(
                data.source,
                data.id, 
                data.phage_id,
                data.phage_name,
                data.host_id,
                data.host_name,
                data.host_group,
                data.matrix_data || null,  
                data.normalization,
                data.journal,
                data.year,
                data.first_author,
                data.pubmedID,
                data.description,
                data.doi
            )
        );

        return datasets_pickled;
    })
    .catch( ( error ) => {
        console.log("Error creating pickled Dataset: ", error);
    } )
    .finally( )
    
}

/**
 * function to fetch and instantiate Dataset objects with Matrix Data
 * @returns {Promise<Dataset[]>} - Array of Dataset objects
 */
async function fetch_unpickled_datasets(){
    return axios
    .get("/fetch_unpickled_datasets")
    .then( (response) => {  

        const data = response.data;

        const datasets_unpickled = data.map(data => {

            const matrixData = JSON.parse(data.matrix_data);

            return new Dataset(
                data.source,
                data.id, 
                data.phage_id,
                data.phage_name,
                data.host_id,
                data.host_name,
                data.host_group,
                matrixData || null,  
                data.normalization,
                data.journal,
                data.year,
                data.first_author,
                data.pubmedID,
                data.description,
                data.doi
            );
        });

        return datasets_unpickled;
    })
    .catch( ( error ) => {
        console.log("Error creating unpickled Dataset: ", error);
    } )
    .finally( )
    
}

/**
 * function to fetch all Phages 
 * @returns {Promise<Phage[]>} Array of Dataset objects
 */
async function fetchPhages() {
    return axios
    .get( "/get_phages" )
    .then( ( response ) => {
        const data = response.data;

        const phages = data.map(data => {

            return new Phage(
                data.id,
                data.name,
                data.description,
                data.ncbi_id,
                data.phage_type
            );
        });

        return phages;
    } )
    .catch( ( error ) => {
        console.log("Error fetching phages: ", error);
    } )
    .finally( )
}


function fetchDatasetTable(){
    return axios
    .get("/get_dataset_table")
    .then( (response) => {  
        return response.data;
    })
    .catch( ( error ) => {
        console.log("Error fetching dataset: ", error);
    } )
    .finally( )
}

// function getCSV(){
//     return axios
//     .get("/get_csv", {responseType: "blob"})
//     .then( (response) => {  
//         // create a blob and return it
//         return blob = new Blob([response.data], { type: "text/csv" });
//     })
//     .catch( ( error ) => {
//         console.log("Error creating CSV: ", error);
//     } )
//     .finally( )
// }

function get_unpickled_dataset(){
    return axios
    .get("/get_unpickled_dataset")
    .then( (response) => {  
        return response.data;
    })
    .catch( ( error ) => {
        console.log("Error creating unpickled Dataset: ", error);
    } )
    .finally( )
}

/**
 * Function that fetches and returns a specific dataset
 * @param {String} study - String of specific study.
 * @param {String[]} normalization - Array of specific normalization.
 * 
 * @returns {Promise<Dataset>} - Dataset object.
 */
function fetch_specific_unpickled_dataset(study, normalization){
    return axios
    .get("/fetch_specific_unpickled_dataset", { params: { study, normalization}})
    .then( (response) => {  
        const data = response.data;

        const matrixData = JSON.parse(data.matrix_data);
       
        const dataset_specific = new Dataset(
                                        data.source,
                                        data.id, 
                                        data.phage_id,
                                        data.phage_name,
                                        data.host_id,
                                        data.host_name,
                                        data.host_group,
                                        matrixData || null,  
                                        data.normalization,
                                        data.journal,
                                        data.year,
                                        data.first_author,
                                        data.pubmedID,
                                        data.description,
                                        data.doi
                                    );
        

        return dataset_specific;
    })
    .catch( ( error ) => {
        console.log("Error fetching specific Dataset: ", error);
    } )
    .finally()
}

/**
 * Function that fetches and returns the overview of all datasets, that holds all info, without duplicates (unique studies) and no matrix data for reduced size.
 * @returns {Promise<Dataset[]>} - Array of Dataset objects
 */
function fetch_datasets_overview(){
    return axios
    .get("/fetch_datasets_overview")
    .then( (response) => {  
        const data = response.data;
       
        // convert into Dataset Objects 
        const datasets_info = data.map(data => 
            new Dataset(
                data.source,
                data.id, 
                data.phage_id,
                data.phage_name,
                data.host_id,
                data.host_name,
                data.host_group,
                data.matrix_data || null,  
                data.normalization,
                data.journal,
                data.year,
                data.first_author,
                data.pubmedID,
                data.description,
                data.doi
            )
        );

        return datasets_info;
    })
    .catch( ( error ) => {
        console.log("Error creating unpickled Dataset: ", error);
    } )
    .finally( )
}

function fetch_graph_data(study){
    return axios
    .get("/fetch_graph_data", { params: {study}})
    .then( (response) => {  
        const data = response.data;
        
        return data;
    })
    .catch( ( error ) => {
        console.log("Error fetching Graph Data: ", error);
    } )
    .finally()
}

function fetch_specific_phage_genome(genome){
    return axios
    .get("/fetch_specific_phage_genome", { params: {genome}})
    .then( (response) => {  
        const data = response.data;

        const csvBlob = new Blob([data.gff_data], { type: 'text/csv' });
        const blobUrl = URL.createObjectURL(csvBlob)

        const phage_genome = new PhageGenome(
                                    data.id, 
                                    data.name,
                                    data.phage_id,
                                    blobUrl
                                );
        
        return phage_genome;
    })
    .catch( ( error ) => {
        console.log("Error fetching Phage Genome: ", error);
    } )
    .finally()
}

function fetch_phage_genome_names(){
    return axios
    .get("/fetch_phage_genome_names")
    .then( (response) => {  
        
        return response.data;
    })
    .catch( ( error ) => {
        console.log("Error fetching Phage Genome Names: ", error);
    } )
    .finally()
}