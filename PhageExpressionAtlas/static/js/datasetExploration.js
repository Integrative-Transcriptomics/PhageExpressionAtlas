
/* 

    Herein, are  all Functions that are used on the Dataset Exploration page 

*/
import { embed } from 'gosling.js';

//#region --- Variables ---
let time_series_promise = Promise.resolve(null); // promise variable for the time series data 
let showClassification = false;


// retrieve the colors from index.css
const rootStyles = getComputedStyle(document.documentElement);

const earlyCol = rootStyles.getPropertyValue('--early').trim();
const middleCol = rootStyles.getPropertyValue('--middle').trim();
const lateCol = rootStyles.getPropertyValue('--late').trim();
const overLateCol = rootStyles.getPropertyValue('--over-late').trim();

//#endregion



//#region ---  Functions  ---

//#region .. Main Function (Initialization)
/**
 * Function to initialize the Dataset Exploration Page
 */
export async function initializeExplorationPage(){
    console.log("Exploration loaded");

    //#region HTML Elements

    // get all selections and html elements
    const phage_select = document.getElementById("phages-select");
    const host_select = document.getElementById("hosts-select");
    const study_select = document.getElementById("studies-select");
    const phage_genes_select = document.getElementById("phage-genes-select");
    const host_genes_select = document.getElementById("host-genes-select");
    const classification_select = document.getElementById("classification-method-exploration");
    const early_select = document.getElementById("early-select");
    const middle_select = document.getElementById("middle-select");
    const late_select = document.getElementById("late-select");
    const threshold_input = document.querySelector("#custom-threshold");

    // show classification checkbox
    const show_classification_checkbox = document.getElementById("show-classification-checkbox");

    // variance filter elements for hosts 
    const left_slider_hosts = document.getElementById('left-slider-hosts');
    const right_slider_hosts = document.getElementById('right-slider-hosts');

    const min_input_field_hosts = document.getElementById('min-input-field-hosts');
    const max_input_field_hosts = document.getElementById('max-input-field-hosts');

    // variance filter elements for phages
    const left_slider_phages = document.getElementById('left-slider-phages');
    const right_slider_phages = document.getElementById('right-slider-phages');

    const min_input_field_phages = document.getElementById('min-input-field-phages');
    const max_input_field_phages = document.getElementById('max-input-field-phages');

    // get all spinners and make them visible
    const spinners = document.querySelectorAll(".spinner");
    
    //#endregion

    // fetch all datasets (overview)
    let datasets_info = await fetch_datasets_overview().catch(error => {
        console.error("Error fetching dataset:", error);
        return null;
    })

    // if datasets_info is available, fill selectors
    if(datasets_info) {
        fillSelectors(datasets_info, phage_select, host_select, study_select);
    } 


    //#region Eventlisteners 

    // configure deselect All Buttons to reset Selections 
    const deselectAllButton = document.getElementById("deselect-all-button");
    deselectAllButton.addEventListener('click', () => {
        setTimeout(triggerClearEvent, 700); // delay trigger Clear Event, so its triggered after all graphs loaded, so no errors occur
    });

    // listen for changes in the selects 
    phage_select.addEventListener('sl-change', () =>{
        updateSelections(datasets_info, phage_select, host_select, study_select, phage_select.id);

        const early_select = document.getElementById("early-select");
        const middle_select = document.getElementById("middle-select");
        const late_select = document.getElementById("late-select");
        const threshold_input = document.getElementById("custom-threshold");

        // reset custom threshold inputs/selects
        early_select.innerHTML = '';
        middle_select.innerHTML = '';
        late_select.innerHTML = '';
        threshold_input.innerHTML = '';

        if(!study_select.shadowRoot.querySelector('input').value){
            resetOptions(phage_genes_select.id);
            resetOptions(host_genes_select.id);
        }

        processAfterFilledSelects(); // hide/show all config options
    });

    host_select.addEventListener('sl-change', () =>{
        updateSelections(datasets_info, phage_select, host_select, study_select, host_select.id); 
        
        if(!study_select.shadowRoot.querySelector('input').value){
            resetOptions(phage_genes_select.id);
            resetOptions(host_genes_select.id);
        }

        processAfterFilledSelects(); // hide/show all config options
    });

    // add eventlistener for study select, that listens for changes 
    study_select.addEventListener('sl-change', async ()=> {
        const study = study_select.value;
        const downloadButton = document.getElementById("download-dataset-button");

        let study_dataset_pickled_TPM = datasets_info.filter(dataset => dataset.source === study)[0]; // filter dataset

        fillStudyInfo(study_dataset_pickled_TPM, study_select);  // fill study info based on changes of study_select
        updateSelections(datasets_info, phage_select, host_select, study_select, study_select.id);

        processAfterFilledSelects();

        // reset custom threshold inputs/selects
        early_select.innerHTML = '';
        middle_select.innerHTML = '';
        late_select.innerHTML = '';
        threshold_input.innerHTML = '';

        if(study){

            // configure download dataset button 
            downloadButton.removeAttribute("disabled")
            const tooltip = downloadButton.parentElement; 
            tooltip.content = "Download Dataset"

            downloadDataset(study);

            // update variance double range slider (phage and host heatmap (big) based on host and phage size (number of genes))
            try {
                // fetch phage and host gene size 
                const size_dict = await get_host_phage_size(study)

                // adjust the double-range slider based on dataset size for hosts
                right_slider_hosts.max = size_dict.hosts;
                right_slider_hosts.value = size_dict.hosts;
                max_input_field_hosts.max = size_dict.hosts;
                max_input_field_hosts.value = size_dict.hosts;
                left_slider_hosts.max= size_dict.hosts - 2;
                left_slider_hosts.value = Math.round(size_dict.hosts * 0.9);
                min_input_field_hosts.max = size_dict.hosts - 2;
                min_input_field_hosts.value = Math.round(size_dict.hosts * 0.9);
                updateRangeFill(left_slider_hosts, right_slider_hosts) 

                // adjust the double-range slider based on dataset size for phages
                right_slider_phages.max = size_dict.phages;
                right_slider_phages.value = size_dict.phages;
                max_input_field_phages.max = size_dict.phages;
                max_input_field_phages.value = size_dict.phages;
                left_slider_phages.max= size_dict.phages - 2;
                left_slider_phages.value = 0;
                min_input_field_phages.max = size_dict.phages - 2;
                min_input_field_phages.value = 0;
                updateRangeFill(left_slider_phages, right_slider_phages) 

            } catch (error) {
                console.log('Failed to get host and phage gene size', error)
            }

            // show all spinners
            spinners.forEach(spinner => {
                toggleSpinner(spinner.id, true);
            })   

            // fill select elements for gene selection based of the unpickled dataset
            try{
                let dataset_unpickled = await fetch_specific_unpickled_dataset(study,"TPM_means"); // fetch unpickled dataset
                
                fillGeneSelects(dataset_unpickled, phage_genes_select, host_genes_select); // fill gene select
            }
            catch(error){
                console.log('Failed to fetch unpickled Data', error)
            }
 
            
            // fetch data for time series plots and plot them 
            time_series_promise = fetch_time_series_data(study);
            time_series_promise.then(async time_series_data => {     

                const classification_value = classification_select.value;

                if(classification_value){
                    if(classification_value === "CustomThreshold"){
                        //  only fetch data and create classification chart, if all selects regarding dataset choice have a selected value and all custom threshold parameters are set
                        if(study_select.value && host_select.value && study_select.value && early_select.value && middle_select.value && late_select.value && threshold_input.value){
                        
                            const custom_threshold_data = await get_class_custom_threshold_data(study_select.value, early_select.value, middle_select.value, late_select.value, threshold_input.value);
        
                            createClassTimeseries(custom_threshold_data, classification_value);
                        }

                    }else{
                        createClassTimeseries(time_series_data.phages,classification_value);
                    }
                }
                

                // turn spinner off
                toggleSpinner('class-timeseries-spinner', false)

                // trigger change event for classification select, to initialize default value
                classification_select.dispatchEvent(new Event('sl-change', { bubbles: true }));
                

                return time_series_data;
            }).catch(error => {
                console.log('Failed to fetch data for the Graphs', error)
                return null; 
            });

            // get min max values for host heatmap data
            let vals_hosts = [parseInt(left_slider_hosts.value), parseInt(right_slider_hosts.value)]

            // get min max values for phage heatmap data
            let vals_phages = [parseInt(left_slider_phages.value), parseInt(right_slider_phages.value)]


            // fetch host and phage heatmap data based on the min max values 
            const results = await Promise.allSettled([
                fetch_host_heatmap_data(study, vals_hosts,null),fetch_phage_heatmap_data(study, vals_phages,null)
            ]);

            const heatmap_data_hosts = results[0].status === 'fulfilled' ? results[0].value : null;
            const heatmap_data_phages = results[1].status === 'fulfilled' ? results[1].value : null;

            if(heatmap_data_phages){
                // create the heatmap
                createInteractionHeatmap(heatmap_data_phages, 'phage-heatmap-container');

                // hide spinner for host heatmap
                toggleSpinner('phage-heatmap-spinner', false); 
            }
            else{
                console.log("Failed creating phage heatmap")
            }
            
            if(heatmap_data_hosts){
                // create the heatmap
                createInteractionHeatmap(heatmap_data_hosts, 'host-heatmap-container');

                // hide spinner for host heatmap
                toggleSpinner('host-heatmap-spinner', false); 
            }
            else{
                console.log("Failed creating host heatmap")
            }

            
            
        }else{
            // reset everything
            phage_genes_select.innerHTML= '';
            host_genes_select.innerHTML= '';

            downloadButton.setAttribute("disabled",'')
            const tooltip = downloadButton.parentElement; 
            tooltip.content = "Please make your selections first";

            resetGraphs();
        }
    });


    // eventlistener for the classification select element, that changes the classification based on the selected Value
    classification_select.addEventListener('sl-change', async(event) => {
        const classification_value = event.target.value;
        const time_series_data = await time_series_promise; 
        const data = time_series_data.phages;
        const custom_div = document.querySelector(".custom-threshold-container");
        
        if(classification_value === "CustomThreshold"){

            // get all classification selects 
            const early_select = document.getElementById("early-select");
            const middle_select = document.getElementById("middle-select");
            const late_select = document.getElementById("late-select");
            const threshold_input = document.getElementById("custom-threshold");


            if(early_select.value && middle_select.value && late_select.value){
                custom_div.style.display = "flex"; // show custom threshold container

                const custom_threshold_data = await get_class_custom_threshold_data(study_select.value, early_select.value, middle_select.value, late_select.value, threshold_input.value);
        
                createClassTimeseries(custom_threshold_data, classification_value);

                if(showClassification){
                    // get selected phage
                    const selected_phage = phage_select.shadowRoot.querySelector('input').value;

                    const selectedPhageGenes = phage_genes_select.value;

                    const genome_name = await fetch_genome_name_with_organism_name(selected_phage, 'phage');
                    
                    const assembly_etc = await get_assembly_maxEnd(genome_name, "phage");


                    // create genome view with the custom threshold gene classification
                    createGenomeView(`/fetch_specific_phage_genome_with_custom_threshold/${genome_name}/${study_select.value}/${early_select.value}/${middle_select.value}/${late_select.value}/${threshold_input.value}`, document.getElementById("phage-genome"), classification_value,selectedPhageGenes, showClassification,assembly_etc);
                }

                

            }else{

                const all_options = custom_div.querySelectorAll("sl-option");

                // if the selects are not yet filled with options (=> all_options is empty), we will fill them
                if(!all_options.length){

                    const data_json = JSON.parse(data); // convert data to json 
                    const timepoints = [...new Set(data_json.map(item=> item.Time))]; // get all timepoints

                    
                    // loop through all 3 selects to fill them with timepoints as options
                    [early_select, middle_select, late_select].forEach(select => {

                        timepoints.forEach(t => {
                            if(t === "Ctrl"){
                                t = -1;
                            }
                            const option = document.createElement("sl-option");
                            option.textContent = t;
                            option.value = t; 

                            select.appendChild(option);
                        });

                    });
                }

                // add eventlisteners for each select 
                early_select.addEventListener('sl-change', async(event) =>{
                    let value = event.target.value;

                    // fetch options of middle and late selects 
                    const middle_options = middle_select.querySelectorAll("sl-option");
                    const late_options = late_select.querySelectorAll("sl-option");
                
                    if(value !== ""){
                        value = Number(event.target.value);

                        middle_options.forEach(opt => {
                            const optValue = Number(opt.value);

                            if (optValue <= value){
                                opt.disabled = true;
                            }

                        });

                        late_options.forEach(opt => {
                            const optValue = Number(opt.value);

                            if (optValue <= value){
                                opt.disabled = false;
                            }

                        });

                        //  only fetch data and create classification chart, if all selects regarding dataset choice have a selected value and all custom threshold parameters are set
                        if(study_select.value && host_select.value && study_select.value && value && middle_select.value && late_select.value && threshold_input.value){
                        
                            const custom_threshold_data = await get_class_custom_threshold_data(study_select.value, value, middle_select.value, late_select.value, threshold_input.value);
        
                            createClassTimeseries(custom_threshold_data, classification_value);


                            if(showClassification){
                                // get selected phage
                                const selected_phage = phage_select.shadowRoot.querySelector('input').value;
                                
                                const selectedPhageGenes = phage_genes_select.value;

                                const genome_name = await fetch_genome_name_with_organism_name(selected_phage, 'phage');

                                const assembly_etc = await get_assembly_maxEnd(genome_name, "phage");

                                // create genome view with the custom threshold gene classification
                                createGenomeView(`/fetch_specific_phage_genome_with_custom_threshold/${genome_name}/${study_select.value}/${early_select.value}/${middle_select.value}/${late_select.value}/${threshold_input.value}`, document.getElementById("phage-genome"), classification_value,selectedPhageGenes, showClassification,assembly_etc);
                            }
                        }





                    }else{

                        // if no value, show all options that are disabled again by removing the disabled attribute
                        late_options.forEach(opt => {
                            const optValue = Number(opt.value);
                        
                            // if the option is disabled, handle it
                            if (opt.hasAttribute("disabled")){

                                // handle the cases in which early select still has a value selected 
                                if(middle_select.value){

                                    // only reset the disabeling for those that are bigger than the middle_select value
                                    if(optValue > middle_select.value ){
                                        opt.disabled = false;
                                    }
                                }else{
                                    // if no early boundary is selected, reset the disabeling for all options
                                    opt.disabled = false;
                                }
                                
                            }
                        });

                        middle_options.forEach(opt => {
                            const optValue = Number(opt.value);
                        
                            // if the option is disabled, handle it
                            if (opt.hasAttribute("disabled")){

                                // handle the cases in which late select still has a value selected 
                                if(late_select.value){

                                    // only reset the disabeling for those that are smaller than the late_select value
                                    if(optValue < late_select.value ){
                                        opt.disabled = false;
                                    }
                                }else{
                                    // if no late boundary is selected, reset the disabeling for all options
                                    opt.disabled = false;
                                }
                                
                            }
                        });


                        
                    }
                    
                        
                })

                middle_select.addEventListener('sl-change', async(event) =>{
                    let value = event.target.value;

                    const late_options = document.querySelectorAll("#late-select sl-option");
                    const early_options = document.querySelectorAll("#early-select sl-option");

                    if(value !== ""){
                        value = Number(event.target.value);

                        late_options.forEach(opt => {
                            const optValue = Number(opt.value);
                        
                            if (optValue <= value){
                                opt.disabled = true;
                            }
                        });

                        early_options.forEach(opt => {
                            const optValue = Number(opt.value);
                        
                            if (optValue >= value){
                                opt.disabled = true;
                            }
                        });
                        

                        //  only fetch data and create classification chart, if all selects regarding dataset choice have a selected value and all custom threshold parameters are set
                        if(study_select.value && host_select.value && study_select.value && early_select.value &&value && late_select.value && threshold_input.value){
                            
                            const custom_threshold_data = await get_class_custom_threshold_data(study_select.value, early_select.value, value, late_select.value, threshold_input.value);

                            createClassTimeseries(custom_threshold_data, classification_value);

                            if(showClassification){
                                
                                // get selected phage
                                const selected_phage = phage_select.shadowRoot.querySelector('input').value;

                                const selectedPhageGenes = phage_genes_select.value;
                                

                                const genome_name = await fetch_genome_name_with_organism_name(selected_phage, 'phage');

                                const assembly_etc = await get_assembly_maxEnd(genome_name, "phage");

                                // create genome view with the custom threshold gene classification
                                createGenomeView(`/fetch_specific_phage_genome_with_custom_threshold/${genome_name}/${study_select.value}/${early_select.value}/${middle_select.value}/${late_select.value}/${threshold_input.value}`, document.getElementById("phage-genome"), classification_value,selectedPhageGenes, showClassification,assembly_etc);
                            }
                        }

                    }else{
                        // if no value, show all options that are disabled again by removing the disabled attribute
                        late_options.forEach(opt => {
                            const optValue = Number(opt.value);
                        
                            // if the option is disabled, handle it
                            if (opt.hasAttribute("disabled")){

                                // handle the cases in which early select still has a value selected 
                                if(early_select.value){

                                    // only reset the disabeling for those that are bigger than the early_select value
                                    if(optValue > early_select.value ){
                                        opt.disabled = false;
                                    }
                                }else{
                                    // if no early boundary is selected, reset the disabeling for all options
                                    opt.disabled = false;
                                }
                                
                            }
                        });

                        early_options.forEach(opt => {
                            const optValue = Number(opt.value);
                        
                            // if the option is disabled, handle it
                            if (opt.hasAttribute("disabled")){

                                // handle the cases in which late select still has a value selected 
                                if(late_select.value){

                                    // only reset the disabeling for those that are smaller than the late_select value
                                    if(optValue < late_select.value ){
                                        opt.disabled = false;
                                    }
                                }else{
                                    // if no late boundary is selected, reset the disabeling for all options
                                    opt.disabled = false;
                                }
                                
                            }
                        });
                        
                    }

                    
                });


                late_select.addEventListener('sl-change', async(event) =>{
                    let value = event.target.value;

                    if(value !== ""){
                        value = Number(event.target.value);
                    }

                    const middle_options = document.querySelectorAll("#middle-select sl-option");
                    const early_options = document.querySelectorAll("#early-select sl-option");

                    if(value !== ""){
                        
                        middle_options.forEach(opt => {
                            const optValue = Number(opt.value);
                        
                            if (optValue >= value){
                                opt.disabled = true;
                            }
                        });

                        early_options.forEach(opt => {
                            const optValue = Number(opt.value);
                        
                            if (optValue >= value){
                                opt.disabled = true;
                            }
                        });
                        

                        //  only fetch data and create classification chart, if all selects regarding dataset choice have a selected value and all custom threshold parameters are set
                        if(study_select.value && host_select.value && study_select.value && early_select.value && middle_select.value && value && threshold_input.value){
                        
                            const custom_threshold_data = await get_class_custom_threshold_data(study_select.value, early_select.value, middle_select.value, value, threshold_input.value);

                            createClassTimeseries(custom_threshold_data, classification_value);

                            if(showClassification){
                                // get selected phage
                                const selected_phage = phage_select.shadowRoot.querySelector('input').value;

                                const selectedPhageGenes = phage_genes_select.value;

                                const genome_name = await fetch_genome_name_with_organism_name(selected_phage, 'phage');
                                
                                const assembly_etc = await get_assembly_maxEnd(genome_name, "phage");

                                // create genome view with the custom threshold gene classification
                                createGenomeView(`/fetch_specific_phage_genome_with_custom_threshold/${genome_name}/${study_select.value}/${early_select.value}/${middle_select.value}/${late_select.value}/${threshold_input.value}`, document.getElementById("phage-genome"), classification_value,selectedPhageGenes, showClassification,assembly_etc);
                            }
                        }

                    }else{
                        // if no value, show all options that are disabled again by removing the disabled attribute
                        middle_options.forEach(opt => {
                            const optValue = Number(opt.value);
                        
                            // if the option is disabled, handle it
                            if (opt.hasAttribute("disabled")){

                                // handle the cases in which early select still has a value selected 
                                if(early_select.value){

                                    // only reset the disabeling for those that are bigger than the early_select value
                                    if(optValue > early_select.value ){
                                        opt.disabled = false;
                                    }
                                }else{
                                    // if no early boundary is selected, reset the disabeling for all options
                                    opt.disabled = false;
                                }
                                
                            }
                        });

                        early_options.forEach(opt => {
                            const optValue = Number(opt.value);
                        
                            // if the option is disabled, handle it
                            if (opt.hasAttribute("disabled")){

                                // handle the cases in which late select still has a value selected 
                                if(middle_select.value){

                                    // only reset the disabeling for those that are smaller than the middle_select value
                                    if(optValue < middle_select.value ){
                                        opt.disabled = false;
                                    }
                                }else{
                                    // if no middle boundary is selected, reset the disabeling for all options
                                    opt.disabled = false;
                                }
                                
                            }
                        });
                        
                    }

                    
                });

                threshold_input.addEventListener('sl-input', async(event) => {
                    const value = event.target.value;

                    if(value !== ""){
                        //  only fetch data and create classification chart, if all selects regarding dataset choice have a selected value and all custom threshold parameters are set
                        if(study_select.value && host_select.value && study_select.value && early_select.value && middle_select.value && late_select.value && value){
                            
                            const custom_threshold_data = await get_class_custom_threshold_data(study_select.value, Number(early_select.value), Number(middle_select.value), Number(late_select.value), value);

                            createClassTimeseries(custom_threshold_data, classification_value);


                            if(showClassification){

                                // get selected phage
                                const selected_phage = phage_select.shadowRoot.querySelector('input').value;

                                const selectedPhageGenes = phage_genes_select.value;

                                const genome_name = await fetch_genome_name_with_organism_name(selected_phage, 'phage');
                                
                                const assembly_etc = await get_assembly_maxEnd(genome_name, "phage");

                                // create genome view with the custom threshold gene classification
                                createGenomeView(`/fetch_specific_phage_genome_with_custom_threshold/${genome_name}/${study_select.value}/${early_select.value}/${middle_select.value}/${late_select.value}/${threshold_input.value}`, document.getElementById("phage-genome"), classification_value,selectedPhageGenes, showClassification, assembly_etc);
                            }
                        }

                    }
                    
                });
                
                custom_div.style.display = "flex"; // show custom threshold container
            } 

        }else{
            custom_div.style.display = "none"; // hide custom threshold container

            //  only create Classification chart, if all selects regarding dataset choice have a selected value
            if(study_select.value && host_select.value && study_select.value){
                createClassTimeseries(data,classification_value)

                if(showClassification){

                    // get selected phage
                    const selected_phage = phage_select.shadowRoot.querySelector('input').value;

                    const selectedPhageGenes = phage_genes_select.value;

                    const genome_name = await fetch_genome_name_with_organism_name(selected_phage, 'phage');
                    
                    const assembly_etc = await get_assembly_maxEnd(genome_name, "phage");

                    // create genome view with ClassMax or ClassThreshold (in classification_value variable)
                    createGenomeView(`/api/fetch_specific_genome/${genome_name}/${study_select.value}/phage`, document.getElementById("phage-genome"), classification_value, selectedPhageGenes, showClassification, assembly_etc);

                    
                }
            }

            
            
        }
    });
    
    // eventlistener for phage gene select
    phage_genes_select.addEventListener('sl-change',async () => {
        const selectedPhageGenes = phage_genes_select.value;

        const time_series_data = await time_series_promise; // await time series data promise

        // create gene time series plot and gene heatmaps
        if (time_series_data){

            // create gene time series and hide spinner
            createGeneTimeseries(time_series_data.phages, selectedPhageGenes,"phage-genes-timeseries-container");
            toggleSpinner('phage-genes-timeseries-spinner', false)

            // create gene heatmaps and hide spinner
            createGeneHeatmaps(study_select.value, selectedPhageGenes, 'phage', "phage-gene-heatmap-container" );
            toggleSpinner('phage-genes-heatmap-spinner', false);
        }

        //create genome view

        // get selected phage
        const selected_phage = phage_select.shadowRoot.querySelector('input').value;

        const genome_name = await fetch_genome_name_with_organism_name(selected_phage, 'phage');

        const assembly_etc = await get_assembly_maxEnd(genome_name, "phage");

        const classification_value = classification_select.value;

        if(classification_value === "CustomThreshold"){
            if(study_select.value && early_select.value && middle_select.value && late_select.value && threshold_input.value){

                // create genome view with the custom threshold gene classification
                createGenomeView(`/fetch_specific_phage_genome_with_custom_threshold/${genome_name}/${study_select.value}/${early_select.value}/${middle_select.value}/${late_select.value}/${threshold_input.value}`, document.getElementById("phage-genome"), classification_value,selectedPhageGenes, showClassification,assembly_etc);
            }


        }else{
        
            if(study_select.value){
                // create genome view with ClassMax or ClassThreshold (in classification_value variable)
                createGenomeView(`/api/fetch_specific_genome/${genome_name}/${study_select.value}/phage`, document.getElementById("phage-genome"), classification_value, selectedPhageGenes, showClassification, assembly_etc);
            }
            
        }
        toggleSpinner("phage-genome-spinner", false);


    });

    // eventlistener for host gene select
    host_genes_select.addEventListener('sl-change',async () => {

        const selectedHostGenes = host_genes_select.value;

        const time_series_data = await time_series_promise; // await time series data promise

        if (time_series_data){

            // create gene time series and hide spinner
            createGeneTimeseries(time_series_data.hosts, selectedHostGenes,"host-genes-timeseries-container");
            toggleSpinner('host-genes-timeseries-spinner', false);

            // create gene heatmaps and hide spinner
            createGeneHeatmaps(study_select.value, selectedHostGenes, 'host', "host-gene-heatmap-container" );
            toggleSpinner('host-genes-heatmap-spinner', false);
        }

        // get host id of selected host
        const selected_host = host_select.shadowRoot.querySelector('input').value;

        const genome_name = await fetch_genome_name_with_organism_name(selected_host, 'host');

        const assembly_etc = await get_assembly_maxEnd(genome_name, "host");

        if(study_select.value){
            createGenomeView(`/api/fetch_specific_genome/${genome_name}/${study_select.value}/host`, document.getElementById("host-genome"), "ClassMax", selectedHostGenes, false, assembly_etc);
        }
        

        toggleSpinner("host-genome-spinner", false)
    });

    // eventlistener for show classification checkbox 
    show_classification_checkbox.addEventListener('sl-change', (event) => {
        showClassification = event.target.checked; // save the state (checked: true or false) in the global variable

        // dispatch event to trigger phage gene select change event 
        phage_genes_select.dispatchEvent(new Event('sl-change', { bubbles: true }));
    })




    // .. Host Heatmap filtering by variance ..

    updateRangeFill(left_slider_hosts, right_slider_hosts)

    left_slider_hosts.addEventListener('input',async(event) =>{
        
        let value = event.target.value;

        if (value >= parseInt(right_slider_hosts.value)){
            value = parseInt(right_slider_hosts.value) - 2;
            left_slider_hosts.value= value;
        }

        updateRangeFill(left_slider_hosts, right_slider_hosts);
        min_input_field_hosts.value = value;
        
    })

    right_slider_hosts.addEventListener('input',(event) =>{
        let value = event.target.value;

        if(value <= parseInt(left_slider_hosts.value)){
            value = parseInt(left_slider_hosts.value) + 2;
            right_slider_hosts.value = value;
        }
        updateRangeFill(left_slider_hosts, right_slider_hosts);
        max_input_field_hosts.value = value;
    })

    // on left slider change, update the heatmap data 
    left_slider_hosts.addEventListener('change', async(event) => {
        
        const vals = [parseInt(event.target.value), parseInt(right_slider_hosts.value)]
        const heatmap_data_hosts = await fetch_host_heatmap_data(study_select.value, vals,null)
        createInteractionHeatmap(heatmap_data_hosts, 'host-heatmap-container');
    })
    // on right slider change, update the heatmap data 
    right_slider_hosts.addEventListener('change', async(event) => {

        const vals = [parseInt(left_slider_hosts.value), parseInt(event.target.value)]
        const heatmap_data_hosts = await fetch_host_heatmap_data(study_select.value, vals,null)
        createInteractionHeatmap(heatmap_data_hosts, 'host-heatmap-container');
    })

    // eventlistener for the number input fields or the double range sliders 
    // that listens for changes and updates the slider accordingly
    min_input_field_hosts.addEventListener('input',(event) => {
        let value = event.target.value;
        if(value === ""){
            value = 0;
        }
        if (value >= parseInt(max_input_field_hosts.value)){
            value = parseInt(max_input_field_hosts.value) - 2;
            min_input_field_hosts.value = value;
        }
        left_slider_hosts.value = value;
        updateRangeFill(left_slider_hosts, right_slider_hosts);
        left_slider_hosts.dispatchEvent(new Event('change', { bubbles: true }));
    });

    max_input_field_hosts.addEventListener('input',(event) => {
        let value = event.target.value;
        if (value <= parseInt(min_input_field_hosts.value)){
            value = parseInt(min_input_field_hosts.value) + 2;
            max_input_field_hosts.value = value;
        }
        right_slider_hosts.value = value;
        updateRangeFill(left_slider_hosts, right_slider_hosts);

        right_slider_hosts.dispatchEvent(new Event('change', { bubbles: true }))
    });


    // .. Phage Heatmap filtering by variance..

    updateRangeFill(left_slider_phages, right_slider_phages)

    left_slider_phages.addEventListener('input',async(event) =>{
        let value = event.target.value;
       
        if (value >= parseInt(right_slider_phages.value)){
            value = parseInt(right_slider_phages.value) - 2;
            left_slider_phages.value= value;
        }

        updateRangeFill(left_slider_phages, right_slider_phages);
        min_input_field_phages.value = value;
    })

    right_slider_phages.addEventListener('input',(event) =>{
        let value = event.target.value;

        if(value <= parseInt(left_slider_phages.value)){
            value = parseInt(left_slider_phages.value) + 2;
            right_slider_phages.value = value;
        }
        updateRangeFill(left_slider_phages, right_slider_phages);
        max_input_field_phages.value = value;
    })

    // eventlistener for the number input fields or the double range sliders 
    // that listens for changes and updates the slider accordingly
    min_input_field_phages.addEventListener('input',(event) => {
        let value = event.target.value;
        if(value === ""){
            value = 0;
        }
        if (value >= parseInt(max_input_field_phages.value)){
            value = parseInt(max_input_field_phages.value) - 2;
            min_input_field_phages.value = value;
        }
        left_slider_phages.value = value;
        updateRangeFill(left_slider_phages, right_slider_phages);

        left_slider_phages.dispatchEvent(new Event('change', { bubbles: true }))
    });

    max_input_field_phages.addEventListener('input',(event) => {
        let value = event.target.value;

        if (value <= parseInt(min_input_field_phages.value)){
            value = parseInt(min_input_field_phages.value) + 2;
            max_input_field_phages.value = value;
        }
        right_slider_phages.value = value;
        updateRangeFill(left_slider_phages, right_slider_phages);

        right_slider_phages.dispatchEvent(new Event('change', { bubbles: true }))
    });

    // on left slider change, update the heatmap data 
    left_slider_phages.addEventListener('change', async(event) => {

        const vals = [parseInt(event.target.value), parseInt(right_slider_phages.value)];



        const heatmap_data_phages = await fetch_phage_heatmap_data(study_select.value, vals,null)
        createInteractionHeatmap(heatmap_data_phages, 'phage-heatmap-container');
    })
    // on right slider change, update the heatmap data 
    right_slider_phages.addEventListener('change', async(event) => {

        const vals = [parseInt(left_slider_phages.value), parseInt(event.target.value)]

        const heatmap_data_phages = await fetch_phage_heatmap_data(study_select.value, vals,null)
        createInteractionHeatmap(heatmap_data_phages, 'phage-heatmap-container');
    })

    //#endregion
  

    // save session storage if user clicks on explore genome button 
    const explore_genome_button = document.getElementById("explore-genome-button");

    explore_genome_button.addEventListener('click', async(event) => {

        event.preventDefault();

        // get selected phage
        const selected_phage = phage_select.shadowRoot.querySelector('input').value;

        const genome_name = await fetch_genome_name_with_organism_name(selected_phage, 'phage');

        // save genome name and dataset in session storage 
        sessionStorage.setItem("genome-redirect-params", JSON.stringify({"select1": genome_name, "select2": study_select.value}))

        window.location.href = "/genome-viewer"
    });

    
}

//#endregion

//#region .. Functions used in initializeExploration Page ..
// Function is adapted from https://medium.com/@predragdavidovic10/native-dual-range-slider-html-css-javascript-91e778134816 by Predrag Davidovic
/**
 * Function that updates the color fill of the double range slider 
 * @param {HTMLElement} left_slider - Left slider element.
 * @param {HTMLElement} right_slider - Right slider element.
 */
function updateRangeFill(left_slider, right_slider){
    const min = parseInt(left_slider.value);
    const max = parseInt(right_slider.value);

    const range = right_slider.max - right_slider.min;

    right_slider.style.background = `linear-gradient(
        to right,
        var(--slider-gray) 0%,
        var(--slider-gray) ${(min / range) * 100}%,
        var(--col5) ${(min / range) * 100}%,
        var(--col5) ${(max / range) * 100}%,
        var(--slider-gray) ${(max / range) * 100}%,
        var(--slider-gray) 100%
      )`;
}

/**
 * Function to fill and update all selectors 
 * @param {Dataset[]} datasets_info - Array of Datasets Overview: only unique datasets/no matrix data.
 * @param {sl-select} phage_select - Shoelace's select element for phages.
 * @param {sl-select} host_select - Shoelace's select element for hosts.
 * @param {sl-select} study_select - Shoelace's select element for studies.
 */
async function fillSelectors(datasets_info, phage_select, host_select, study_select){

    // get all initial single selector options 
    const phages = [...new Set(datasets_info.map(dataset => dataset.phageName))]; // get all phages

    

    const defaultPhage = phages.sort()[0];    // select first phage as default                              

    // get from sessionStorage the parameters for each select element
    // the sessionstorage is set in data overview if the user selects a dataset that should be explored in dataset exploration 
    const params = JSON.parse(sessionStorage.getItem('overview-redirect-params'));

    let select1Value;
    let select2Value;
    let select3Value;

    if(params){
        select1Value = params.select1;
        select2Value = params.select2;
        select3Value = params.select3;
        sessionStorage.removeItem('overview-redirect-params') // remove paramteres from sessionStorage
    }else{ 
        // if params, set select 1 value to default phage
        select1Value = defaultPhage;
    }
    
    let validRows = datasets_info.filter(dataset =>  dataset.phageName === select1Value); // filter the dataset based on the default value 

    const hosts = [...new Set(validRows.map(dataset => dataset.hostName))];  // get all hosts
    const studies = [...new Set(validRows.map(dataset => dataset.source))];  // get all datasets

    if(select1Value && select2Value &&select3Value){
        // fill the selectors based on the defaultPhage
        fillOptions(phage_select, phages, select1Value);
        fillOptions(host_select, hosts, select2Value);
        fillOptions(study_select, studies, select3Value);
    }
    else{
        // fill the selectors based on the defaultPhage
        fillOptions(phage_select, phages, select1Value);
        fillOptions(host_select, hosts, hosts[0]);
        fillOptions(study_select, studies, studies[0]);
    }
}



/**
 * Function to fill a single selector for Phage-Host Interaction
 * @param {sl-select} select - select element.
 * @param {string[]} options - Options for the select element.
 * @param {string} defaultValue - Default Value for the select element.
 */
function fillOptions(select, options, defaultValue) {

    // clear existing options
    select.innerHTML = ''; 

    // if its a multiple select emlement add select and deselect buttons
    if (select.hasAttribute('multiple')){
        select.innerHTML = `<div class="options-config">
                        <sl-button size="small" class="select-all-button select-deselect-buttons" pill>
                            <sl-icon slot="prefix" name="check"> </sl-icon>
                            Select all
                        </sl-button>
                        <sl-button size="small" class="deselect-all-button select-deselect-buttons" pill>
                            <sl-icon slot="prefix" name="x"> </sl-icon>
                            Deselect all</sl-button>
                    </div>`;
    }

    // sort options alphabetically 
    options.sort();

    options.forEach(option => {
    
      // remove whitespaces and replace them with underscores for value attribute
      const optionUnderscore = option.replace(/\s+/g, '_');

      // create option element, change value/text content and append to select element
      const opt = document.createElement('sl-option');
      opt.value = optionUnderscore;
      opt.textContent = option;
      select.appendChild(opt);
    });


    // change default value
    if(defaultValue){

        setTimeout(() => {
            setValueAndTriggerChange(select, defaultValue);
        }, 10);
    }
}

/**
 * Function that sets the value of an select element and triggers an sl-change event
 * @param {sl-select} select - select element.
 * @param {string} value - Value for the select element.
 */
async function setValueAndTriggerChange(select, value) {

    await select.updateComplete;  // wait for Shoelace to render the component

    // retrieve the values (different methods for single select and multiple select)
    if(select.hasAttribute('multiple')){
        select.value = value
    }else{
        select.value = value.replace(/\s+/g, '_');
        select.shadowRoot.querySelector('input').value = value;
    }

    // dispatch an "sl-change" event to trigger event listeners
    select.dispatchEvent(new Event('sl-change', { bubbles: true }));
}


/**
 * Function to fill information about selected dataset in info-study
 * @param {Dataset} dataset - Array of Datasets.
 * @param {HTMLElement} study_select - Shoelace's select element for Studies.
 */
function fillStudyInfo(dataset, study_select){
    
    // fill info-study
    const option = study_select.shadowRoot.querySelector('input').value; // get currently selected study
    const infoContainer = document.getElementById("info-study");         // get info container

    if(option){
        // update content
        infoContainer.innerHTML = `
                                    <p class="small-p">First Author: ${dataset.firstAuthor}</p>
                                    <p class="small-p">Year: ${dataset.year}</p>
                                    <p class="small-p">Journal: ${dataset.journal}</p>
                                    <p class="small-p">Pubmed ID: ${dataset.pubmedID}</p>
                                    <p class="small-p">Description:</p>
                                    <p class="small-p">${dataset.description}</p>
                                    <p class="small-p">Doi: <a href="${dataset.doi}">${dataset.doi}</a> </p>
                                    `;
    }else{
        infoContainer.innerHTML = "No Information available";
    }
}

/**
 * Function to reset a single selector for Phage-Host Interaction by removing all options
 * @param {string} selectId - ID of the select element.
 */
function resetOptions(selectId){
    const select = document.getElementById(selectId);

    // clear existing options
    select.innerHTML = ''; 

}

/**
 * Function to trigger a clear event for the select elements
 */
function triggerClearEvent(){
    const selectors = document.querySelectorAll(".selector.single");
    
    selectors.forEach(selector => {
        // clear selections
        selector.setAttribute("value", "")
        selector.shadowRoot.querySelector('input').value = "";
        
        // dispatch an "sl-change" event to trigger event listeners
        selector.dispatchEvent(new Event('sl-change', { bubbles: true }));
    })

    //reset classification selection
    const classification_method = document.getElementById("classification-method-exploration");
    classification_method.value = "ClassMax";

    resetOptions("hosts-select"); // reset options
    resetOptions("studies-select"); // reset options
}

/**
 * Function that hides all configuration options if none of the selects are chosen 
 * and performs different tasks that run only if all selects are filled
 */
function processAfterFilledSelects(){
    const phage_select = document.getElementById("phages-select");
    const host_select = document.getElementById("hosts-select");
    const study_select = document.getElementById("studies-select");
    const slider_hosts = document.getElementById("slider-hosts");
    const slider_phages = document.getElementById("slider-phages");
    const class_box = document.querySelector("#show-classification-checkbox");
    const explore_genome_button = document.querySelector("#explore-genome-button");

    if(phage_select.value && host_select.value && study_select.value) {
        // show config options
        slider_hosts.style.display = 'block';
        slider_phages.style.display = 'block';
        class_box.style.display = 'block';
        explore_genome_button.style.display = 'flex';
        
    } else {
        // hide config options
        slider_hosts.style.display = 'none';
        slider_phages.style.display = 'none';
        class_box.style.display = 'none';
        explore_genome_button.style.display = 'none';
    }
}


/**
 * Function to update single selectors options for Phage-Host Interaction
 * @param {Dataset[]} datasets - Array of Datasets.
 * @param {sl-select} phage_select - Select element for Phages.
 * @param {sl-select} host_select - Select element for Hosts.
 * @param {sl-select} study_select - Select element for Studies.
 */
function updateSelections(datasets, phage_select, host_select, study_select, changedSelect) {
    const phageValue = phage_select.shadowRoot.querySelector('input').value;
    const hostValue = host_select.shadowRoot.querySelector('input').value;
    const studyValue = study_select.shadowRoot.querySelector('input').value;

    let validRows = datasets;

    // filter by phage if selected
    if (phageValue) {
        validRows = filterDatasetByValue(validRows, 'phageName', phageValue);
    }

    // get unique hosts and studies
    const hosts_filtered = getUniqueValues(validRows, 'hostName');
    const studies_filtered = getUniqueValues(validRows, 'source');

    // if phage is selected, handle host and study options
    if (phageValue) {
        // host value was selected, but not study value
        if (hostValue && !studyValue) {

            fillOptions(host_select, hosts_filtered, null);

            // filter options for study select based on host select
            validRows = filterDatasetByValue(validRows, 'hostName', hostValue);
            const uniqueVals = getUniqueValues(validRows, 'source'); 
            

            if(uniqueVals.length === 1){
                // if there is only one possible option, set it as default
                fillOptions(study_select, uniqueVals, uniqueVals[0]);
            }else{
                // if not, no default
                fillOptions(study_select, getUniqueValues(validRows, 'source'), null);
            }
            
        } 
        // study value is selected before host value
        else if (studyValue && !hostValue) {

            fillOptions(study_select, studies_filtered, null);
            validRows = filterDatasetByValue(validRows, 'source', studyValue);

            
            const uniqueVal = getUniqueValues(validRows, 'hostName');

            // if a study is selected, there will only be one possible host, hence, set it as default
            fillOptions(host_select, uniqueVal, uniqueVal[0]);

        } else if (studyValue && hostValue) {
            if (changedSelect === host_select.id) {
                validRows = filterDatasetByValue(validRows, 'hostName', hostValue);
                fillOptions(study_select, getUniqueValues(validRows, 'source'), null);
                resetGraphs();
            } else if (changedSelect === study_select.id) {
                // validRows = filterDatasetByValue(validRows, 'source', studyValue);
                fillOptions(host_select, getUniqueValues(validRows, 'hostName'), null);
            } else if (changedSelect === phage_select.id) {
                validRows = filterDatasetByValue(datasets, 'phageName', phageValue);
                fillOptions(host_select, getUniqueValues(validRows, 'hostName'), null);
                fillOptions(study_select, getUniqueValues(validRows, 'source'), null);
                // reset host and study select inputs
                host_select.setAttribute("value", "");
                host_select.shadowRoot.querySelector('input').value = "";
                study_select.setAttribute("value", "");
                study_select.shadowRoot.querySelector('input').value = "";
                resetGraphs();
            }
            
        } else {
            fillOptions(host_select, hosts_filtered, null);
            fillOptions(study_select, studies_filtered, null);
        }
    }
}

/**
 * Function that extracts all values with a given key from a dataset and returns an array of unique values.
 * @param {Dataset[]} dataset - Array of Datasets
 * @param {String} key - String
 * @returns {String[]} - filtered Dataset
 */
function getUniqueValues(dataset, key) {
    return [...new Set(dataset.map(item => item[key]))];
}

/**
 * Function that filters a dataset by a value with a key.
 * @param {Dataset[]} dataset - Array of datasets
 * @param {String} key - key
 * @param {String} value - value
 * @returns {Dataset[]}
 */
function filterDatasetByValue(dataset, key, value) {
    return dataset.filter(item => item[key] === value);
}

/**
 * Function that fills the Gene Selects
 * @param {Dataset} dataset - Dataset.
 * @param {sl-select} phage_genes_select - Shoelace's select element for phage genes.
 * @param {sl-select} host_genes_select - Shoelace's select element for host genes.
 */
function fillGeneSelects(dataset, phage_genes_select, host_genes_select){

    // access matrix Data
    const matrixData = dataset.matrixData.data;   

    
    // seperate host and phage matrix data to get genes later on seperatly 
    const hostMatrix = matrixData.filter(row => row.entity === "host");
    const phageMatrix = matrixData.filter(row => row.entity === "phage");

    

    // extract all host and phage genes from seperate matrix data 
    const phageSymbols = phageMatrix.map( row => {return row.symbol});
    const hostSymbols = hostMatrix.map( row => {return row.symbol});

    const defaultPhageGenes = phageSymbols.slice(0,3);
    const defaultHostGenes = hostSymbols.slice(0,3);

    // add the first gene (if sorted) to the default lists
    defaultPhageGenes.push(phageSymbols.sort()[0]);
    defaultHostGenes.push(hostSymbols.sort()[0]);
    
    // fill the select elements 
    fillOptions(phage_genes_select,phageSymbols, defaultPhageGenes);
    fillOptions(host_genes_select,hostSymbols, defaultHostGenes);  


    // configure select all und deselect all buttons of gene selects
    const selectAllButtonPhages = document.querySelector("#phage-genes-select .select-all-button");
    const selectAllButtonHosts = document.querySelector("#host-genes-select .select-all-button");

    selectAllButtonPhages.addEventListener('click', () => {
        const options = Array.from(phage_genes_select.querySelectorAll('sl-option')).map(option => option.value);

        setValueAndTriggerChange(phage_genes_select, options);
    });

    selectAllButtonHosts.addEventListener('click', () => {
        const options = Array.from(host_genes_select.querySelectorAll('sl-option')).map(option => option.value);

        setValueAndTriggerChange(host_genes_select, options);
    });

    const deselectAllButtonPhages = document.querySelector("#phage-genes-select .deselect-all-button");
    const deselectAllButtonHosts = document.querySelector("#host-genes-select .deselect-all-button");

    deselectAllButtonPhages.addEventListener('click', () => {
        // clear selections
        phage_genes_select.value = "";
        
        phage_genes_select.dispatchEvent(new Event('sl-change', { bubbles: true }));
    });


    deselectAllButtonHosts.addEventListener('click', () => {
        // clear selections
        host_genes_select.value = "";
        
        host_genes_select.dispatchEvent(new Event('sl-change', { bubbles: true }));
    });
}

/**
 * Function that handles the download of the chosen Dataset/Study
 * @param {string} study - selected Study.
 */
async function downloadDataset(study){

    const datasets = await Promise.all([
        fetch_specific_unpickled_dataset(study, "fractional"),
        fetch_specific_unpickled_dataset(study, "TPM"),
        fetch_specific_unpickled_dataset(study, "TPM_means"),
        fetch_specific_unpickled_dataset(study, "TPM_std")
    ]);


    // extract id, matrix data and normalization and save the rest for saving of only necessary info
    const { id, matrixData, normalization, ...filteredDataset } = datasets[0];

    // get the keys (to ensure correct order of the csv file later (order of constructor, not alphabetical order))
    // here it does not matter which normalization dataset
    const keys = Object.keys(filteredDataset);
    
    // convert json -> csv (information)
    var csv = Papa.unparse({
        fields: keys,
        data: [filteredDataset]
    });

    // create zip file with JSZip
    const zip = new JSZip();

    // add files to the zip file
    zip.file(`${study}.txt`, csv)
    zip.file(`${study}.csv`, csv)

    datasets.forEach(dataset => {
        const normalization = dataset.normalization;

        const matrixCsv = convertMatrixToCSV(dataset);

        zip.file(`${study}_matrix_data_${normalization}.csv`, matrixCsv)
    })
    
 
    // access the download button 
    const downloadButton = document.getElementById("download-dataset-button")

    // generate zip and add it to the download button
    zip.generateAsync({type:"blob"}).then(function(content) {
        const url = URL.createObjectURL(content);
        // add dataset url to download button
        downloadButton.href = url;
        downloadButton.download = study;
    })
    
}

/**
 * Function converts the matrix Data of a dataset into a content for a csv file
 * @param {Dataset} dataset - Dataset.
 * @returns {string} - CSV file content.
 */
function convertMatrixToCSV(dataset) {
    const matrix = dataset.matrixData.data;
    const timePoints = dataset.matrixData.columns; 
    const fields = ["geneID", "symbol", "entity", ...timePoints.map(String)];

    // convert the matrix so that each time point has a seperate column again
    const csvData = matrix.map(row => {
        let rowData = {
            geneID: row.geneID,
            symbol: row.symbol,
            entity: row.entity
        };
      
        // add time points as separate columns
        timePoints.forEach((timePoint, index) => {
            rowData[`${timePoint}`] = row.values[index]; 
        });
      
        return rowData;
    });

    // convert json -> csv (matrixData)
    const matrixCsv = Papa.unparse({
        fields: fields,
        data: csvData
    })


    return matrixCsv 
}   

/**
 * Function to create a heatmap with Plotly.js
 * @param {Array<{z: Array[], x: Array[], y:Array[], type: string, coloraxis: string }>} data - The heatmap data array;
 * @param {String} container - Container name.
 * @param {Boolean} selectedGenes - Boolean.
*/
function createHeatmap(data, container, selectedGenes = false){
    
    const layout = {
        xaxis: {
            title: {text: 'Time [min]',
                font: {
                    size: 13,
                    family: 'Arial, sans-serif',
                    color: 'black'
                }
            },
            type: 'category',
            tickmode: 'array', 
            ticktext: data.x,
        },
        margin: {
            l: 25,  
            r: 5,  
            b: 50,  
            t: 30   
        },
        yaxis: {
            title: {text: 'Genes',
                font: {
                    size: 13,
                    family: 'Arial, sans-serif',
                    color: 'black'
                }
            },
            type: 'category',
            ticks: '',
            tickmode: 'array', 
            ticktext: data.y, 
            showticklabels: false,
            automargin: true
        },
        
        coloraxis: {
            colorbar: {
                thickness: 20  
            },
            cmin: -1.5, 
            cmax: 1.5,
            colorscale: [
                [0, '#6788ee'],    
                [0.2, '#9abbff'],  
                [0.4, '#c9d7f0'],  
                [0.6, '#edd1c2'],  
                [0.8, '#f7a889'],  
                [1, '#e26952']     
            ] 

        },
        annotations: [{
            text: '',
            xref: 'paper',
            yref: 'paper',
            x: 0.5,
            y: 0.5,
            showarrow: false,
            font: { size: 14 }
        }]
    };

    

    if (selectedGenes){
        layout.yaxis.showticklabels =  true;
        layout.margin.l = 60;
        delete layout.yaxis.ticks;
        delete layout.yaxis.title;

        if(data[0].z.length === 0){
            layout.annotations[0].text = 'Nothing selected. Please select genes first.'
        }

        if(data[0].z.length === 1){
            layout.annotations[0].text = 'Please select more than one gene <br> to generate a heatmap'
            
            data[0].z = [];
            data[0].y = [];
        }

    }else{
        if (data[0].z.length === 0){
            layout.annotations[0].text = 'Nothing selected. <br> Please make your selections first.'
        }

        if(data[0].z.length === 1){
            layout.annotations[0].text = 'Please select more than one gene via the slider above <br> to generate a heatmap'
            
            data[0].z = [];
            data[0].y = [];
        }
    }

    const dataset = document.getElementById("studies-select");

    var config = {
        scrollZoom: false, 
        modeBarButtonsToRemove: ['resetScale2d', 'zoom2d'],
        displayModeBar: true,
        displaylogo: false, 
        responsive:true, 
        toImageButtonOptions: {
            format: 'png',
            filename: `Heatmap_PhageExpressionAtlas_${dataset.value}`, 
            height:500, 
            width: 500, 
            scale: 5, 
        },
        modeBarButtonsToAdd: [
            {
              name: "help",
              title: "Need help?",
              icon: Plotly.Icons.question,
              click: function(gd) {
                window.location.href = "/help#guide-exploration";
              }
            },
          ],

    }


    Plotly.newPlot(container, data, layout, config)
}


/**
 * Function that creates the Heatmaps in the section Phage-Host interactions
 * @param {*} data - data.
 * @param {string} container - container id.
 */
function createInteractionHeatmap(data, container){
    // get the data into correct format
    var data = [{
        z: data.z,
        x: data.x,
        y: data.y,
        type: 'heatmap',
        coloraxis: 'coloraxis',
        xgap: 0.17,  
        ygap: 0.17, 
        hovertemplate: 'Timepoint: %{x}<br>Gene: %{y}<br>Value: %{z}<extra></extra>', //change hover text
    }];

    // create the heatmap
    createHeatmap(data, container); 

}

/**
 * Function that resets all graphs, by creating either an empty graph, or in case of genome maps, hiding it
 */
function resetGraphs(){
    const graph_container = document.querySelectorAll(".graph-container");

    graph_container.forEach(container => {
        if(container.id.includes("heatmap")){

            const data = [{
            z: [[null]],
            type: 'heatmap',
            colorscale: 'Viridis',
            showscale: false,
            hoverinfo: 'skip'
            }];

            const layout = {
                xaxis: {
                    title: {text: 'Time [min]',
                        font: {
                            size: 13,
                            family: 'Arial, sans-serif',
                            color: 'black'
                        }
                    },
                    type: 'category',
                    tickmode: 'array', 
                    ticktext: data.x,
                },
                margin: {
                    l: 25,  
                    r: 5,  
                    b: 50,  
                    t: 30  
                },
                yaxis: {
                    type: 'category',
                    ticks: '',
                    tickmode: 'array', 
                    ticktext: data.y, 
                    showticklabels: false,
                },
                
                coloraxis: {
                    colorbar: {
                        thickness: 20 
                    },
                    cmin: -1.5, 
                    cmax: 1.5,
                    colorscale: [
                        [0, '#6788ee'],    
                        [0.2, '#9abbff'],  
                        [0.4, '#c9d7f0'],  
                        [0.6, '#edd1c2'],  
                        [0.8, '#f7a889'],  
                        [1, '#e26952']     
                    ] 
        
                },
                annotations: [{
                    text: 'Nothing selected. <br> Please make your selections first',
                    xref: 'paper',
                    yref: 'paper',
                    x: 0.5,
                    y: 0.5,
                    showarrow: false,
                    font: { size: 14 }
                }]
            };

            Plotly.newPlot(container, data, layout, {displayModeBar: false});
        }
        else if(container.id.includes("timeseries")){
            const layout =  {
                xaxis: {
                    title: {text: 'Time [min]',
                        font: {
                            size: 13,
                            family: 'Arial, sans-serif',
                            color: 'black'
                        }
                    },
                    type: 'linear',
                    tickmode: 'array', 
                    range: [0, 6]
                },
                yaxis: {
                    title: {text: 'Relative Expression',
                        font: {
                            size: 13,
                            family: 'Arial, sans-serif',
                            color: 'black'
                        }
                    },
                    range: [0, 6]
                },
                margin: {
                    b: 50,  
                    t: 30   
                },
                legend: {
                    tracegroupgap: 8, 
                    itemsizing: 'constant', 
                    title: {
                        text: 'Gene Classification',
                        font: {
                            size: 13,
                            family: 'Arial, sans-serif',
                            color: 'black'
                        }
        
                    },
                    font: {
                        size: 13, 
                        family: 'Arial, sans-serif'
                    }
                },
                annotations: [{
                    text: 'Nothing selected. <br> Please make your selections first',
                    xref: 'paper',
                    yref: 'paper',
                    x: 0.5,
                    y: 0.5,
                    showarrow: false,
                    font: { size: 14 }
                }]
            };

            Plotly.newPlot(container, [], layout, {displayModeBar: false});
        }
        else if(container.id.includes("genome")){
            container.style.display = "none"
        }
    })
}


/**
 * Function that creates the Phage Gene Expression Profiles
 */
function createClassTimeseries(data, classType){
    if(typeof(data) === 'string'){
        data = JSON.parse(data)
    }

    const traces = [];
    const uniqueGenes = [...new Set(data.map(item => item.Symbol))]; // get unique genes

    // create a dictionary that maps the classes to their colors
    const classColorMap = {
        'early': earlyCol,
        'middle': middleCol,
        'late': lateCol,
        'not classified': 'gray', 
        'above late bound': overLateCol,
    };

    // loop through unique genes to create all traces for the graph
    uniqueGenes.forEach(gene => {
        // from the data, filter the trace data that matches the gene
        const traceData = data.filter(item => item.Symbol === gene);

        // set the class value depending on if class max or classThreshold is chosen
        let classValue;
        if(classType === 'ClassMax'){
            classValue = traceData[0].ClassMax;
        }else if(classType === 'ClassThreshold'){
            classValue = traceData[0].ClassThreshold;
        }else if(classType === 'CustomThreshold'){
            classValue = traceData[0].CustomThreshold;
        }
        
        // get timepoints and values
        const timepoints = traceData.map(item=> item.Time);
        const values = traceData.map(item=> item.Value);

        if (classValue === null || classValue === "None"){
            classValue = 'not classified'
        } 

        let lineColor = classColorMap[classValue]; // get line color
        
        // add everything to the trace
        traces.push({
            x: timepoints, 
            y: values, 
            mode: 'lines', 
            line: {color: lineColor, width: 1},
            name: classValue,
            legendgroup: classValue,
            gene: gene,
            hovertemplate: `Gene: ${gene}` //change hover text
        });
        

        
    });

    // iterate over traces and hide duplicate group legends 
    const legendGroups = new Set();
    traces.forEach(trace => {
        if (legendGroups.has(trace.legendgroup)) {
            trace.showlegend = false; // hide legend for subsequent traces in the same group
        } else {
            trace.showlegend = true; // show legend for the first trace in the group
            legendGroups.add(trace.legendgroup);
        }
    });

    // specify the plot layout
    const layout =  {
        xaxis: {
            title: {text: 'Time [min]',
                font: {
                    size: 13,
                    family: 'Arial, sans-serif',
                    color: 'black'
                }
            },
            type: 'linear',
            tickmode: 'array', 
            ticktext: data.x 
        },
        yaxis: {
            title: {text: 'Relative Expression',
                font: {
                    size: 13,
                    family: 'Arial, sans-serif',
                    color: 'black'
                }
            },
            ticktext: data.y 
        },
        margin: {
            b: 50,  
            t: 30   
        },
        legend: {
            tracegroupgap: 8, 
            itemsizing: 'constant', 
            title: {
                text: 'Gene Classification',
                font: {
                    size: 13,
                    family: 'Arial, sans-serif',
                    color: 'black'
                }

            },
            font: {
                size: 13, 
                family: 'Arial, sans-serif'
            }
        }
    };

    const dataset = document.getElementById("studies-select");
    
    // specify configurations
    var config = {
        scrollZoom: false, 
        modeBarButtonsToRemove: ['resetScale2d', 'zoom2d'],
        displayModeBar: true,
        displaylogo: false, 
        responsive:true, 
        toImageButtonOptions: {
            format: 'png',
            filename: `gene_classification_PhageExpressionAtlas_${dataset.value}`, 
            height:500, 
            width: 1000, 
            scale: 5, 
        },
        modeBarButtonsToAdd: [
            {
              name: "downloadCsv",
              title: "Download Gene Classification as CSV",
              icon: Plotly.Icons.disk,
              click: (gd) => {

                // create csv 
                const rows = [];
                rows.push("gene,classification");

                gd.data.forEach(trace => {
                    if (!trace.x || !trace.y) return;

                    const classification_value = trace.name;
                    const gene_name = trace.gene;

                    rows.push(`${gene_name},${classification_value}`);
                })

                const csvContent = rows.join("\n");
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                
                // handle download
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `gene_classification_${dataset.value}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              },
            },
            {
                name: "help",
                title: "Need help?",
                icon: Plotly.Icons.question,
                click: function(gd) {
                  window.location.href = "/help#guide-exploration"
                }
              },
          ],
    }

    Plotly.newPlot("class-timeseries-container", traces,layout, config); // create Plotly graph
    
}

/**
 * Function created time series plot of phage and host genes
 * @param {String} data - data.
 * @param {String[]} selectedGenes - Array of selected Genes.
 * @param {String} container - Container for Plot.
 */
function createGeneTimeseries(data, selectedGenes, container){
    data = JSON.parse(data);

    const traces = [];

    // specify the plot layout
    const layout =  {
        xaxis: {
            title: {text: 'Time [min]',
                font: {
                    size: 12,
                    family: 'Arial, sans-serif',
                    color: 'black'
                }
            },
            type: 'linear',
            tickmode: 'array', 
            ticktext: data.x 
        },
        yaxis: {
            title: {text: 'Relative Expression',
                font: {
                    size: 12,
                    family: 'Arial, sans-serif',
                    color: 'black'
                }
            },
            ticktext: data.y 
        },
        margin: {
            b: 50,  
            t: 30   
        },
        legend: {
            tracegroupgap: 8, 
            itemsizing: 'constant', 
            font: {
                size: 12, 
                family: 'Arial, sans-serif'
            }
        },
        annotations: [{
            text: '',
            xref: 'paper',
            yref: 'paper',
            x: 0.5,
            y: 0.5,
            showarrow: false,
            font: { size: 14 }
        }]
    };

    // if no genes are selected, display annotation
    if(selectedGenes.length === 1 && selectedGenes[0] === ''){
        layout.annotations[0].text = 'Nothing selected. Please select genes first.'
    }
    // if genes are selected create visualization
    else{
        // loop through selected genes to create traces 
        selectedGenes.forEach(gene => {
            // get the according data to the gene
            const traceData = data.filter(item => item.Symbol === gene);
            
            // get timepoints and values
            const timepoints = traceData.map(item=> item.Time);
            const values = traceData.map(item=> item.Value);

            // add trace 
            traces.push({
                x: timepoints, 
                y: values, 
                mode: 'lines', 
                line: { width: 1},
                name: gene,
            });
        });
    }

    const dataset = document.getElementById("studies-select");

    var config = {
        scrollZoom: false, 
        modeBarButtonsToRemove: ['resetScale2d', 'zoom2d'],
        displayModeBar: true,
        displaylogo: false, 
        responsive:true, 
        toImageButtonOptions: {
            format: 'png',
            filename: `gene_timeseries_PhageExpressionAtlas_${dataset.value}`, 
            height:500, 
            width: 500, 
            scale: 5, 
        }, 
        modeBarButtonsToAdd: [
            {
              name: "help",
              title: "Need help?",
              icon: Plotly.Icons.question,
              click: function(gd) {
                window.location.href = "/help#guide-exploration"
              }
            },
          ],


    }

    Plotly.newPlot(container, traces,layout, config); // create plot
}

/**
 * Function that creates the heatmaps for the gene selection section. Based on the selected genes, the heatmap data will change 
 * @param {string} study 
 * @param {String[]} selectedGenes 
 * @param {string} type 
 * @param {string} container 
 */
async function createGeneHeatmaps (study, selectedGenes, type, container){
    
    let data;

    // create the data depending on if the type is phage or host
    if (type === 'phage'){
        // fetch host heatmap data
        data = await fetch_phage_heatmap_data(study, null, selectedGenes)

        data = [{
            z: data.z,
            x: data.x, 
            y: data.y,
            type: 'heatmap',
            coloraxis: 'coloraxis',
            xgap: 0.3,  
            ygap: 0.3, 
            hovertemplate: 'Timepoint: %{x}<br>Gene: %{y}<br>Value: %{z}<extra></extra>', //change hover text
        }];
        // filter z and y values for only the genes that are selected
        data = updateHeatmapDataBasedOnSelectedGenes(data,selectedGenes);

    } else if (type === 'host'){
    
        // fetch host heatmap data
        data = await fetch_host_heatmap_data(study, null, selectedGenes)

        data = [{
            z: data.z,
            x: data.x,
            y: data.y,
            type: 'heatmap',
            coloraxis: 'coloraxis',
            xgap: 0.3,  
            ygap: 0.3, 
            hovertemplate: 'Timepoint: %{x}<br>Gene: %{y}<br>Value: %{z}<extra></extra>', //change hover text
        }];
    }

    // create heatmap
    createHeatmap(data, container, true);
}

/**
 * Function that takes Heatmap data and updates it based on the selected genes
 * @param {Array<{z: Array[], x: Array[], y:Array[], type: string, coloraxis: string }>} data - The heatmap data array;
 * @param {String[]} selectedGenes - Array of selected genes.
 * 
 * @returns {Array<{z: Array[], x: Array[], y:Array[], type: string, coloraxis: string }>} data - Updated heatmap data array;
*/
function updateHeatmapDataBasedOnSelectedGenes(data, selectedGenes){
    // filter z and y values for only the genes that are selected
    const selectedIndices = [];

    // loop through all gene names in data (y-values)
    data[0].y.forEach(gene => {

        // for each gene, check if its in the list of selected genes
        if(selectedGenes.includes(gene)){
            // if yes, add the index of the geneto the selected indices list
            const idx = data[0].y.indexOf(gene);
            selectedIndices.push(idx);
        }
    })

    const newY = [];
    const newZ = [];

    // for each selected index, take the according entry from y and z data
    selectedIndices.forEach(idx => {
        newY.push(data[0].y[idx]);
        newZ.push(data[0].z[idx]);
    })

    // update the data
    data[0].y = newY;
    data[0].z = newZ;

    return data;
}

/**
 * Function that creates the genome visualization
 * @param {string} url 
 * @param {string} container 
 * @param {string} classValue 
 * @param {string[]} selectedGenes 
 * @param {boolean} showClassification 
 * @param {Object} assembly_etc 
 */
function createGenomeView(url, container, classValue, selectedGenes, showClassification, assembly_etc){

    // retrieve the assembly 
    const assembly = assembly_etc.assembly;
    const last_end = assembly_etc.maxLengthEntryEnd;

    container.style.display = "block"; // show genome maps container

    if(showClassification){
        embed(container, {
            "arrangement": "horizontal",
            "spacing": 40,
            "assembly": assembly,
            "style": {
                "outlineWidth": 1,
                "outline": "lightgray",
            },
            "views": [
                //linear view
                {
                    "layout": "linear", 
                    "spacing": 5,
                    "style": {
                        "outlineWidth": 1,
                        "outline": "lightgray"
                    },
    
                    "data": {
                            "type": "csv",
                            "url": url,
                            "chromosomeField": "seq_id",
                            "genomicFields": ["start", "end"],
                            
                    },
                    "x": { "field": "start", "type": "genomic","linkingId": "linear-view"},
                    "xe": { "field": "end", "type": "genomic" },
                    "stroke": { "value": "gray"},
    
                    "tracks": [
                        // gene track with classification 
                        {
                            "title": 'Gene Classification',
                            "alignment": "overlay",
                            "data": {
                                "type": "csv",
                                "url": url,
                                "chromosomeField": "seq_id",
                                "genomicFields": ["start", "end"],
                            },
                            // tracks inside the Gene Classification track
                            "tracks": [
                                
                                // rectangle for forward strand (+)
                                {
                                    "mark": "rect",
                                    "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene'] }, {"type": "filter", "field": "strand", "oneOf": ['+']},
                                    {
                                        "type": "concat",
                                        "separator": "-",
                                        "newField": "start_end",
                                        "fields": ["start", "end"]
                                    }, {"type": "filter", "field": "gene", "oneOf": selectedGenes, "not": false}],
                                    "x": { "field": "start", "type": "genomic"}, 
                                    "xe": { "field": "adjusted_end", "type": "genomic" },
                                    "zoomLimits": [1000, last_end + 100],
                                    "color": {
                                        "field": classValue,
                                        "type": "nominal",
                                        "domain": ['early', 'middle', 'late', 'None', 'above late bound', null],
                                        "range": [earlyCol, middleCol, lateCol, 'gray', overLateCol, 'gray'],
                                        "legend": true
                                    }, 
                            
                                },
                                // right triangle to indicate forward strand (+)
                                {
                                    "mark": "triangleRight",
                                    "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene'] }, {"type": "filter", "field": "strand", "oneOf": ['+']}, {"type": "filter", "field": "gene", "oneOf": selectedGenes, "not": false}],
                                    "x": { "field": "adjusted_end", "type": "genomic"}, 
                                    "xe": { "field": "end", "type": "genomic" },
                                    "zoomLimits": [1000, last_end + 100],
                                    "color": {
                                        "field": classValue,
                                        "type": "nominal",
                                        "domain": ['early', 'middle', 'late', 'None', 'above late bound', null],
                                        "range": [earlyCol, middleCol, lateCol, 'gray', overLateCol, 'gray'],
                                        "legend": true
                                    }, 
                                
                                },
    
                                // rectangle for reverse strand (-)
                                {"mark": "rect",
                                    "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene']}, {"type": "filter", "field": "strand", "oneOf": ['-']}, {
                                        "type": "concat",
                                        "separator": "-",
                                        "newField": "start_end",
                                        "fields": ["start", "end"]
                                    }, {"type": "filter", "field": "gene", "oneOf": selectedGenes, "not": false}],
                                    "x": { "field": "adjusted_start", "type": "genomic"}, 
                                    "xe": { "field": "end", "type": "genomic" },
                                    "zoomLimits": [1000, last_end + 100],
                                    "color": {
                                        "field": classValue,
                                        "type": "nominal",
                                        "domain": ['early', 'middle', 'late', 'None', 'above late bound', null],
                                        "range": [earlyCol, middleCol, lateCol, 'gray', overLateCol, 'gray'],
                                        "legend": true
                                    }, 
                                    
                                },
                                // left triangle to indicate reverse strand (-)
                                {"mark": "triangleLeft",
                                    "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene']}, {"type": "filter", "field": "strand", "oneOf": ['-']}, {"type": "filter", "field": "gene", "oneOf": selectedGenes, "not": false}],
                                    "x": { "field": "start", "type": "genomic"}, 
                                    "xe": { "field": "adjusted_start", "type": "genomic" },
                                    "zoomLimits": [1000, last_end + 100],
                                    "color": {
                                        "field": classValue,
                                        "type": "nominal",
                                        "domain": ['early', 'middle', 'late', 'None', 'above late bound', null],
                                        "range": [earlyCol, middleCol, lateCol, 'gray', overLateCol, 'gray'],
                                        "legend": true
                                    }, 
                                    
                                },

                                // NOT SELECTED GENES: rectangle for forward strand (+)
                                {
                                    "mark": "rect",
                                    "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene'] }, {"type": "filter", "field": "strand", "oneOf": ['+']},
                                    {
                                        "type": "concat",
                                        "separator": "-",
                                        "newField": "start_end",
                                        "fields": ["start", "end"]
                                    }, {"type": "filter", "field": "gene", "oneOf": selectedGenes, "not": true}],
                                    "x": { "field": "start", "type": "genomic"}, 
                                    "xe": { "field": "adjusted_end", "type": "genomic" },
                                    "zoomLimits": [1000, last_end + 100],
                                    "color": {
                                        "field": classValue,
                                        "type": "nominal",
                                        "domain": ['early', 'middle', 'late', 'None', 'above late bound', null],
                                        "range": ['#D9D9D9'],
                                    },  
                            
                                },
                                // NOT SELECTED GENES: right triangle to indicate forward strand (+)
                                {
                                    "mark": "triangleRight",
                                    "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene'] }, {"type": "filter", "field": "strand", "oneOf": ['+']}, {"type": "filter", "field": "gene", "oneOf": selectedGenes, "not": true}],
                                    "x": { "field": "adjusted_end", "type": "genomic"}, 
                                    "xe": { "field": "end", "type": "genomic" },
                                    "zoomLimits": [1000, last_end + 100],
                                    "color": {
                                        "field": classValue,
                                        "type": "nominal",
                                        "domain": ['early', 'middle', 'late', 'None', 'above late bound', null],
                                        "range": ['#D9D9D9'],

                                    },  
                                
                                },
    
                                // NOT SELECTED GENES: rectangle for reverse strand (-)
                                {"mark": "rect",
                                    "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene']}, {"type": "filter", "field": "strand", "oneOf": ['-']}, {
                                        "type": "concat",
                                        "separator": "-",
                                        "newField": "start_end",
                                        "fields": ["start", "end"]
                                    }, {"type": "filter", "field": "gene", "oneOf": selectedGenes, "not": true}],
                                    "x": { "field": "adjusted_start", "type": "genomic"}, 
                                    "xe": { "field": "end", "type": "genomic" },
                                    "zoomLimits": [1000, last_end + 100],
                                    "color": {
                                        "field": classValue,
                                        "type": "nominal",
                                        "domain": ['early', 'middle', 'late', 'None', 'above late bound', null],
                                        "range": ['#D9D9D9'],
                                    },  
                                    
                                },
                                // NOT SELECTED GENES: left triangle to indicate reverse strand (-) 
                                {"mark": "triangleLeft",
                                    "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene']}, {"type": "filter", "field": "strand", "oneOf": ['-']}, {"type": "filter", "field": "gene", "oneOf": selectedGenes, "not": true}],
                                    "x": { "field": "start", "type": "genomic"}, 
                                    "xe": { "field": "adjusted_start", "type": "genomic" },
                                    "zoomLimits": [1000, last_end + 100],
                                    "color": {
                                        "field": classValue,
                                        "type": "nominal",
                                        "domain": ['early', 'middle', 'late', 'None', 'above late bound', null],
                                        "range": ['#D9D9D9']
                                    },  
                                    
                                },
                            ],   
                            
    
                            "tooltip": [
                            {"field": "start_end", "type": "nominal", "alt": "Location"},
                            {"field": "gene_biotype", "type": "nominal", "alt": "Gene Biotype"},
                            {"field": "id", "type": "nominal", "alt": "ID"}, 
                            {"field": "locus_tag", "type": "nominal", "alt": "Locus Tag"}, 
                            {"field": "strand", "type": "nominal", "alt": "Strand"},
                            {"field": classValue, "type": "nominal", "alt": "Classification"}
                            ],
                            "height": 65, 
                            "width": container.clientWidth,
                            
    
                        },
                        
                    ],
    
                },
                
                
            ]
            
            
        }, { padding: 0});
    
    }else{
        embed(container, {
            "arrangement": "horizontal",
            "spacing": 40,
            "assembly": assembly,
            "style": {
                "outlineWidth": 1,
                "outline": "lightgray",
            },
            
    
            "views": [
                
                //linear view
                {
                    "layout": "linear", 
                    "spacing": 5,
                    "style": {
                        "outlineWidth": 1,
                        "outline": "lightgray",
                    },
    
                    "data": {
                        "type": "csv",
                        "url": url,
                        "chromosomeField": "seq_id",
                        "genomicFields": ["start", "end"],
                        
                    },
                    "x": { "field": "start", "type": "genomic","linkingId": "linear-view"},
                    "xe": { "field": "end", "type": "genomic" },
                    "stroke": { "value": "gray"},
    
                    "tracks": [
                        // gene track with gene biotype coloring 
                        {
                            "title": 'Gene Biotypes',
                            "alignment": "overlay",
                            "data": {
                                "type": "csv",
                                "url": url,
                                "chromosomeField": "seq_id",
                                "genomicFields": ["start", "end"]
                            },
                            // tracks inside the gene biotype track
                            "tracks": [
                                
                                // rectangle for forward strand (+)
                                {"mark": "rect",
                                    "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene'] }, {"type": "filter", "field": "strand", "oneOf": ['+']},
                                    {
                                        "type": "concat",
                                        "separator": "-",
                                        "newField": "start_end",
                                        "fields": ["start", "end"]
                                    }, {"type": "filter", "field": "gene", "oneOf": selectedGenes, "not": false}],
                                    "x": { "field": "start", "type": "genomic"}, 
                                    "xe": { "field": "adjusted_end", "type": "genomic" },
                                    "color": {
                                        "field": "gene_biotype",
                                        "type": "nominal",
                                        "legend":true
                                    }, 
                                    "zoomLimits": [1000, last_end + 100],
                                },
                                // right triangle to indicate forward strand (+)
                                {
                                    "mark": "triangleRight",
                                    "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene'] }, {"type": "filter", "field": "strand", "oneOf": ['+']}, {"type": "filter", "field": "gene", "oneOf": selectedGenes, "not": false}],
                                    "x": { "field": "adjusted_end", "type": "genomic"}, 
                                    "xe": { "field": "end", "type": "genomic" },
                                    "color": {
                                            "field": "gene_biotype",
                                            "type": "nominal",
                                        }, 
                                    "zoomLimits": [1000, last_end + 100],
                                },
    
    
                                // rectangle for reverse strand (-)
                                {
                                    "mark": "rect",
                                    "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene']}, {"type": "filter", "field": "strand", "oneOf": ['-']}, {
                                        "type": "concat",
                                        "separator": "-",
                                        "newField": "start_end",
                                        "fields": ["start", "end"]
                                    }, {"type": "filter", "field": "gene", "oneOf": selectedGenes, "not": false}],
                                    "x": { "field": "adjusted_start", "type": "genomic"}, 
                                    "xe": { "field": "end", "type": "genomic" },
                                    "color": {
                                        "field": "gene_biotype",
                                        "type": "nominal",
                                    }, 
                                    "zoomLimits": [1000, last_end + 100],
                                },
                                // left triangle to indicate reverse strand (-)
                                {
                                    "mark": "triangleLeft",
                                    "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene']}, {"type": "filter", "field": "strand", "oneOf": ['-']}, {"type": "filter", "field": "gene", "oneOf": selectedGenes, "not": false}],
                                    "x": { "field": "start", "type": "genomic"}, 
                                    "xe": { "field": "adjusted_start", "type": "genomic" },
                                    "color": {
                                        "field": "gene_biotype",
                                        "type": "nominal",
                                    }, 
                                    "zoomLimits": [1000, last_end + 100],
                                },



                                // NOT SELECTED GENES: rectangle for forward strand (+)
                                {"mark": "rect",
                                    "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene'] }, {"type": "filter", "field": "strand", "oneOf": ['+']},
                                    {
                                        "type": "concat",
                                        "separator": "-",
                                        "newField": "start_end",
                                        "fields": ["start", "end"]
                                    }, {"type": "filter", "field": "gene", "oneOf": selectedGenes, "not": true}],
                                    "x": { "field": "start", "type": "genomic"}, 
                                    "xe": { "field": "adjusted_end", "type": "genomic" },
                                    "color": {
                                        "field": "gene_biotype",
                                        "type": "nominal",
                                        "range": ['#D9D9D9']
                                    }, 
                                    "zoomLimits": [1000, last_end + 100],
                                },
                                // NOT SELECTED GENES: right triangle to indicate forward strand (+)
                                {
                                    "mark": "triangleRight",
                                    "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene'] }, {"type": "filter", "field": "strand", "oneOf": ['+']}, {"type": "filter", "field": "gene", "oneOf": selectedGenes, "not": true}],
                                    "x": { "field": "adjusted_end", "type": "genomic"}, 
                                    "xe": { "field": "end", "type": "genomic" },
                                    "color": {
                                            "field": "gene_biotype",
                                            "type": "nominal",
                                            "range": ['#D9D9D9']
                                        }, 
                                    "zoomLimits": [1000, last_end + 100],
                                },
    
    
                                // NOT SELECTED GENES: rectangle for reverse strand (-)
                                {
                                    "mark": "rect",
                                    "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene']}, {"type": "filter", "field": "strand", "oneOf": ['-']}, {
                                        "type": "concat",
                                        "separator": "-",
                                        "newField": "start_end",
                                        "fields": ["start", "end"]
                                    }, {"type": "filter", "field": "gene", "oneOf": selectedGenes, "not": true}],
                                    "x": { "field": "adjusted_start", "type": "genomic"}, 
                                    "xe": { "field": "end", "type": "genomic" },
                                    "color": {
                                        "field": "gene_biotype",
                                        "type": "nominal",
                                        "range": ['#D9D9D9']
                                    }, 
                                    "zoomLimits": [1000, last_end + 100],
                                },
                                // NOT SELECTED GENES: left triangle to indicate reverse strand (-)
                                {
                                    "mark": "triangleLeft",
                                    "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene']}, {"type": "filter", "field": "strand", "oneOf": ['-']}, {"type": "filter", "field": "gene", "oneOf": selectedGenes, "not": true}],
                                    "x": { "field": "start", "type": "genomic"}, 
                                    "xe": { "field": "adjusted_start", "type": "genomic" },
                                    "color": {
                                        "field": "gene_biotype",
                                        "type": "nominal",
                                        "range": ['#D9D9D9']
                                    }, 
                                    "zoomLimits": [1000, last_end + 100],
                                },
                            ], 
                            
                            "tooltip": [
                            {"field": "start_end", "type": "nominal", "alt": "Location"},
                            {"field": "gene_biotype", "type": "nominal", "alt": "Gene Biotype"},
                            {"field": "id", "type": "nominal", "alt": "ID"}, 
                            {"field": "locus_tag", "type": "nominal", "alt": "Locus Tag"}, 
                            {"field": "strand", "type": "nominal", "alt": "Strand"}
                            ],
                            "height": 65, 
                            "width": container.clientWidth,
                        },
                        
                    ],
    
                },
                
                
            ]
            
            
        }, { padding: 0});
    
    }
}


//#endregion

//#endregion