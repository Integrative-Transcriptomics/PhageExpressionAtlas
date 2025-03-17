/*

 * This Page contains all requests to fetch data from the backend

*/

// ---- FUNCTIONS ------------------------------------------------------

/**
 * function to fetch all Phages and turn them into Phage Objects
 * @returns {Promise<Phage[]>} Array of Dataset objects
 */
async function fetch_phages_dict() {
    return axios
    .get( "/fetch_phages_dict" )
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
        console.log("Error fetching datasets overview: ", error);
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

function fetch_host_heatmap_data(study, vals, gene_list){
    return axios
    .get("/fetch_host_heatmap_data", { params: {study, 'vals[]':vals, 'gene_list[]': gene_list}})
    .then( (response) => {  
        const data = response.data;
        return data;
    })
    .catch( ( error ) => {
        console.log("Error fetching host heatmap Data: ", error);
    } )
    .finally()
}

function fetch_specific_phage_genome(genome, dataset){
    return axios
    .get("/fetch_specific_phage_genome", { params: {genome, dataset}})
    .then( (response) => {  
        const data = response.data;

        const phage_genome = new PhageGenome(
                                    data.id, 
                                    data.name,
                                    data.phage_id,
                                    data.gff_data
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

function fetch_nr_of_studies(){
    return axios
    .get("/fetch_nr_of_studies")
    .then( (response) => {  
        return response.data;
    })
    .catch( ( error ) => {
        console.log("Error fetching number of studies: ", error);
    } )
    .finally() 
}

function fetch_datasets_based_on_genome(genome){
    return axios
    .get("/fetch_datasets_based_on_genome", { params: {genome}})
    .then( (response) => {  
        
        return response.data;
    })
    .catch( ( error ) => {
        console.log("Error fetching Dataset names based on genomes: ", error);
    } )
    .finally()
}


function get_host_phage_size(study){
    return axios
    .get("/get_host_phage_size", { params: {study}})
    .then( (response) => {  
        return response.data;
    })
    .catch( ( error ) => {
        console.log("Error fetching Host and Phage gene size: ", error);
    } )
    .finally() 
}

function fetch_host_sunburst_data(){
    return axios
    .get("/fetch_host_sunburst_data")
    .then( (response) => {  
        return response.data;
    })
    .catch( ( error ) => {
        console.log("Error fetching Host sunburst data: ", error);
    } )
    .finally() 
}