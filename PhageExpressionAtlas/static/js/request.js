/*
   This Page contains all requests to fetch data from the backend with axios
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
 * @param {string} study - String of specific study.
 * @param {string[]} normalization - Array of specific normalization.
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

/**
 * Function that fetches and returns the graph data based on a study parameter.
 * @param {string} study - Study name. 
 * @returns {{heatmap_data_phages: {z: [], x: string[], y: string[]}, 
 *            chord_data: object,
 *            class_time_data: {phages: object, hosts: object}}} - Dictionary. 
 */
// TODO: ggf return statement ändern
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

/**
 * Function that fetches and returns host heatmap data based on a study parameter, min max values or gene list.
 * @param {string} study - Study name. 
 * @param {string} vals - Min max values.
 * @param {string[]} gene_list - List of selected genes.
 * 
 * @returns { {x: string[], y: string[], z: []} } - Dictionary. 
*/
function fetch_host_heatmap_data(study, vals, gene_list){
    return axios
    .get("/fetch_host_heatmap_data", { params: {study, 'vals[]':vals, 'gene_list[]': gene_list}})
    .then( (response) => {  
        return response.data;
    })
    .catch( ( error ) => {
        console.log("Error fetching host heatmap Data: ", error);
    } )
    .finally()
}

/**
 * Function that fetches and returns phage heatmap data based on a study parameter, min max values or gene list.
 * @param {string} study - Study name. 
 * @param {string} vals - Min max values.
 * @param {string[]} gene_list - List of selected genes.
 * 
 * @returns { {x: string[], y: string[], z: []} } - Dictionary. 
*/
function fetch_phage_heatmap_data(study, vals, gene_list){
    return axios
    .get("/fetch_phage_heatmap_data", { params: {study, 'vals[]':vals, 'gene_list[]': gene_list}})
    .then( (response) => {  
        return response.data;
    })
    .catch( ( error ) => {
        console.log("Error fetching phage heatmap Data: ", error);
    } )
    .finally()
}

/**
 * Function that fetches and returns a specific phage genome based on the selected genome and dataset.
 * @param {string} genome
 * @param {string} dataset  
 * 
 * @returns {object} - Phage Genome. 
*/
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

/**
 * Function that fetches and returns all phage genome names in the database
 * @returns {string[]} - Array list of all Phage genome names. 
*/
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

/**
 * Function that fetches and returns number of studies currently in the database
 * @returns {string} - Number of studies as string. 
*/
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

/**
 * Function that fetches dataset names based on a selected genome
 * @param {string} genome - genome name.
 * @returns {string[]} - Number of studies as string. 
*/
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

/**
 * Function that fetches and returns host and phage size (number of phage and host genes) based on the study 
 * @param {string} study - Study name. 
 * @returns {{hosts: int, phages: int}} - Number of studies as string. 
*/
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

/**
 * Function that fetches and returns host sunburst data 
 * @returns {{labels: string[], parents: string[], values: int[]}} - Number of studies as string. 
*/
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