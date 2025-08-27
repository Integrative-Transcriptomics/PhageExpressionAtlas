/*
   Herein, are  all Functions that are used on the Dataset Comparison page 
*/

import { embed } from 'gosling.js';

//#region --- Variables ---
let time_series_promise_d1 = Promise.resolve(null); // promise variable for the time series data 

//#region --- Variables ---
let time_series_promise_d2 = Promise.resolve(null); // promise variable for the time series data 


/**
 * Function to initialize the Dataset Comparison Page
 */
export async function initializeDatasetComparisonPage() {
    console.log("Dataset Comparison Page initialized");

    //Get 

    const phage_select_d1 = document.getElementById("phages-select-d1");
    const phage_select_d2 = document.getElementById("phages-select-d2");

    const host_select_d1 = document.getElementById("hosts-select-d1");
    const host_select_d2 = document.getElementById("hosts-select-d2");

    const study_select_d1 = document.getElementById("studies-select-d1");
    const study_select_d2 = document.getElementById("studies-select-d2");

    const deselect_all_d1 = document.getElementById("deselect-all-button-d1");
    const deselect_all_d2 = document.getElementById("deselect-all-button-d2");

    const phage_slider_div_d1 = document.getElementById("slider-phages-d1");
    const host_slider_div_d1 = document.getElementById("slider-hosts-d1");

    const phage_slider_div_d2 = document.getElementById("slider-phages-d2");
    const host_slider_div_d2 = document.getElementById("slider-hosts-d2");

    const phage_genes_select_d1 = document.getElementById("phage-genes-select-d1");
    const host_genes_select_d1 = document.getElementById("host-genes-select-d1");

    const phage_genes_select_d2 = document.getElementById("phage-genes-select-d2");
    const host_genes_select_d2 = document.getElementById("host-genes-select-d2");

    // get all spinners and make them visible
    const spinners_d1 = document.querySelectorAll(".spinner.d1");
    const spinners_d2 = document.querySelectorAll(".spinner.d2");

    // To check whether things are running properly --> console.log
    //console.log(phage_select_d1.id);

    // fetch all datasets (overview)
    const datasets_info = await fetch_datasets_overview().catch(error => {
        console.error("Error fetching dataset:", error);
        return null;
    })

    // if datasets_info is available, fill selectors
    if(datasets_info) {
        fillSelectors(datasets_info, phage_select_d1, host_select_d1, study_select_d1);
        fillSelectors(datasets_info, phage_select_d2, host_select_d2, study_select_d2);
    }else{
        const warning_container = document.getElementById("warning-container-comparison");
        
        // show warning container
        warning_container.style.display = "flex";

        // add function to the close button 
        document.getElementById("close-warning").onclick = function(){
            // hide warning container
            warning_container.style.display = "none";
        }

        // hide all spinners
        spinners_d1.forEach(spinner => {
            toggleSpinner(spinner.id, false);
        });
        spinners_d2.forEach(spinner => {
            toggleSpinner(spinner.id, false);
        })  

        // hide all parameter elements e.g. slider
        processAfterFilledSelects("d1");
        processAfterFilledSelects("d2");
    }

    
    //#region Eventlisteners 
    // configure deselect All Buttons to reset Selections 
    deselect_all_d1.addEventListener('click', () => {
        setTimeout(triggerClearEvent("aside-interaction-d1"), 700); // delay trigger Clear Event, so its triggered after all graphs loaded, so no errors occur
    });

    deselect_all_d2.addEventListener('click', () => {
        setTimeout(triggerClearEvent("aside-interaction-d2"), 700); // delay trigger Clear Event, so its triggered after all graphs loaded, so no errors occur
    });

    // listen for changes in the selects 
    phage_select_d1.addEventListener('sl-change', () =>{
        updateSelections(datasets_info, phage_select_d1, host_select_d1, study_select_d1, phage_select_d1.id, "d1");

        // const early_select = document.getElementById("early-select");
        // const middle_select = document.getElementById("middle-select");
        // const late_select = document.getElementById("late-select");
        // const threshold_input = document.getElementById("custom-threshold");

        // // reset custom threshold inputs/selects
        // early_select.innerHTML = '';
        // middle_select.innerHTML = '';
        // late_select.innerHTML = '';
        // threshold_input.innerHTML = '';

        // if(!study_select_d1.shadowRoot.querySelector('input').value){
        //     resetOptions(phage_genes_select_d1.id);
        //     resetOptions(host_genes_select.id);
        // }

        processAfterFilledSelects("d1"); // hide/show all config options
    });

    host_select_d1.addEventListener('sl-change', () =>{
        updateSelections(datasets_info, phage_select_d1, host_select_d1, study_select_d1, host_select_d1.id, "d1"); 
        
        // if(!study_select.shadowRoot.querySelector('input').value){
        //     resetOptions(phage_genes_select.id);
        //     resetOptions(host_genes_select.id);
        // }

        processAfterFilledSelects("d1"); // hide/show all config options
    });

    // add eventlistener for study select, that listens for changes 
    study_select_d1.addEventListener('sl-change', async ()=> {
        const study = study_select_d1.value;
        
        updateSelections(datasets_info, phage_select_d1, host_select_d1, study_select_d1, study_select_d1.id, "d1");

        processAfterFilledSelects("d1");

        // // reset custom threshold inputs/selects
        // early_select.innerHTML = '';
        // middle_select.innerHTML = '';
        // late_select.innerHTML = '';
        // threshold_input.innerHTML = '';

        if(study){

            // update variance double range slider (phage and host heatmap (big) based on host and phage size (number of genes))
            await initializeVarianceSlider(phage_slider_div_d1, host_slider_div_d1, study);

            // show all spinners
            spinners_d1.forEach(spinner => {
                toggleSpinner(spinner.id, true);
            })   

            const aside_phage_genes_d1 = document.querySelector("#gene-selection  #aside-phage-genes-d1");
            const aside_host_genes_d1 = document.querySelector("#gene-selection  #aside-host-genes-d1");

            // fill select elements for gene selection based of the unpickled dataset

            try{
                const dataset_unpickled = await fetch_specific_unpickled_dataset(study,"TPM_means"); // fetch unpickled dataset             
                
                if(dataset_unpickled){
                    // make gene selects interactable again
                    phage_genes_select_d1.disabled = false;
                    host_genes_select_d1.disabled = false;

                    removeErrorMessage("#gene-selection  #aside-phage-genes-d1");
                    removeErrorMessage("#gene-selection  #aside-host-genes-d1");

                    // fill gene selects
                    fillGeneSelects(dataset_unpickled, phage_genes_select_d1, host_genes_select_d1, "d1"); // fill gene select 
                }else{
                    throw new Error("dataset_unpickled is empty with the result that gene select elements can not be filled");
                }
            }
            catch(error){
                console.log('Failed to fetch unpickled Data', error)

                // disable gene selects
                phage_genes_select_d1.disabled = true;
                host_genes_select_d1.disabled = true;

                // hide all spinners in gene selection div
                const gene_sel_spinners = document.querySelectorAll("#gene-selection .spinner.d1");
                gene_sel_spinners.forEach(spinner => {
                    toggleSpinner(spinner.id, false);
                });
                
                // hide phage genome parameter selections
                // const class_box = document.querySelector("#show-classification-checkbox");
                // const explore_genome_button = document.querySelector("#explore-genome-button");
                // class_box.style.display = 'none';
                // explore_genome_button.style.display = 'none';
                
                // insert error message to aside element below selects
                if(!aside_phage_genes_d1.querySelector(".error-message")){
                    aside_phage_genes_d1.insertAdjacentHTML("beforeend", `
                        <div class="error-message">
                            <sl-icon name="exclamation-triangle"></sl-icon>
                            <p>An issue occurred with gene selection. Therefore, it's currently not possible to study individual genes. Sorry.</p>
                        </div>
                    `);
                }

                if(!aside_host_genes_d1.querySelector(".error-message")){
                    aside_host_genes_d1.insertAdjacentHTML("beforeend", `
                        <div class="error-message">
                            <sl-icon name="exclamation-triangle"></sl-icon>
                            <p>An issue occurred with gene selection. Therefore, it's currently not possible to study individual genes. Sorry.</p>
                        </div>
                    `);
                }
                
            }
 
            
            
            // fetch data for time series plots and plot them 
            time_series_promise_d1 = fetch_time_series_data(study);

            // time_series_promise_d1.then(async time_series_data => {     
                
            //     if(time_series_data){

            //         // remove error message (will be only removed if its present)
            //         removeErrorMessage("#class-timeseries-container-d1");

            //         const time_series_data_phages = JSON.parse(time_series_data.phages); // convert phage data to json 
                    
            //         // if the datasets does not have at least 3 timepoints, disable that the user can select custom threshold
            //         const timepoints = [...new Set(time_series_data_phages.map(item=> item.Time))]; // get all timepoints

            //         // const custom_threshold_option = document.querySelector("#classification-method-exploration > sl-option:nth-child(3)");

            //         // if(timepoints.length <= 2){
            //         //     custom_threshold_option.disabled = true;
            //         // }else{
            //         //     custom_threshold_option.disabled = false;
            //         // }

            //         // const classification_value = classification_select.value;


            //         // if(classification_value){
            //         //     if(classification_value === "CustomThreshold"){
            //         //         //  only fetch data and create classification chart, if all selects regarding dataset choice have a selected value and all custom threshold parameters are set
            //         //         if(study_select.value && host_select.value && study_select.value && early_select.value && middle_select.value && late_select.value && threshold_input.value){
                            
            //         //             const custom_threshold_data = await get_class_custom_threshold_data(study_select.value, early_select.value, middle_select.value, late_select.value, threshold_input.value);
            
            //         //             createClassTimeseries(custom_threshold_data, classification_value);
            //         //         }

            //         //     }else{
            //         //         createClassTimeseries(time_series_data_phages,classification_value);
            //         //     }
            //         // }

            //         createClassTimeseries(time_series_data_phages,classification_value);
                

            //         // turn spinner off
            //         toggleSpinner('class-timeseries-spinner', false)

            //         // trigger change event for classification select, to initialize default value
            //         classification_select.dispatchEvent(new Event('sl-change', { bubbles: true }));
                    

            //         return time_series_data;
            //     }else{
            //         // turn spinner off
            //         toggleSpinner('class-timeseries-spinner', false)

            //         throw new Error("time_series_data is empty with the result that phage gene expression profiles can't be visualized");
            //     }
                
            // }).catch(error => {
            //     console.log('Failed to fetch data for time series graphs', error);

            //     showErrorMessage("class-timeseries-container", "phage gene expression profiles");

            //     return null; 
            // });

            initializeVisualizationsForDataset(study, phage_slider_div_d1, host_slider_div_d1, "phage-heatmap-container-d1", "host-heatmap-container-d1");
            
        }else{
            // // reset everything
            // phage_genes_select.innerHTML= '';
            // host_genes_select.innerHTML= '';

            // downloadButton.setAttribute("disabled",'')
            // const tooltip = downloadButton.parentElement; 
            // tooltip.content = "Please make your selections first";

            resetGraphs("d1");
        }
    });


    phage_select_d2.addEventListener('sl-change', () =>{
        updateSelections(datasets_info, phage_select_d2, host_select_d2, study_select_d2, phage_select_d2.id, "d2");

        // const early_select = document.getElementById("early-select");
        // const middle_select = document.getElementById("middle-select");
        // const late_select = document.getElementById("late-select");
        // const threshold_input = document.getElementById("custom-threshold");

        // // reset custom threshold inputs/selects
        // early_select.innerHTML = '';
        // middle_select.innerHTML = '';
        // late_select.innerHTML = '';
        // threshold_input.innerHTML = '';

        // if(!study_select_d1.shadowRoot.querySelector('input').value){
        //     resetOptions(phage_genes_select_d1.id);
        //     resetOptions(host_genes_select.id);
        // }

        processAfterFilledSelects("d2"); // hide/show all config options
    });

    host_select_d2.addEventListener('sl-change', () =>{
        updateSelections(datasets_info, phage_select_d2, host_select_d2, study_select_d2, host_select_d2.id, "d2"); 
        
        // if(!study_select.shadowRoot.querySelector('input').value){
        //     resetOptions(phage_genes_select.id);
        //     resetOptions(host_genes_select.id);
        // }

        processAfterFilledSelects("d2"); // hide/show all config options
    });

    // add eventlistener for study select, that listens for changes 
    study_select_d2.addEventListener('sl-change', async ()=> {
        const study = study_select_d2.value;
        
        updateSelections(datasets_info, phage_select_d2, host_select_d2, study_select_d2, study_select_d2.id, "d2");

        processAfterFilledSelects("d2");

        // // reset custom threshold inputs/selects
        // early_select.innerHTML = '';
        // middle_select.innerHTML = '';
        // late_select.innerHTML = '';
        // threshold_input.innerHTML = '';

        if(study){

            // update variance double range slider (phage and host heatmap (big) based on host and phage size (number of genes))
            await initializeVarianceSlider(phage_slider_div_d2, host_slider_div_d2, study);


            // show all spinners
            spinners_d2.forEach(spinner => {
                toggleSpinner(spinner.id, true);
            })   

            const aside_phage_genes_d2 = document.querySelector("#gene-selection  #aside-phage-genes-d2");
            const aside_host_genes_d2 = document.querySelector("#gene-selection  #aside-host-genes-d2");

            // fill select elements for gene selection based of the unpickled dataset

            try{
                const dataset_unpickled = await fetch_specific_unpickled_dataset(study,"TPM_means"); // fetch unpickled dataset             
                
                if(dataset_unpickled){
                    // make gene selects interactable again
                    phage_genes_select_d2.disabled = false;
                    host_genes_select_d2.disabled = false;

                    removeErrorMessage("#gene-selection  #aside-phage-genes-d2");
                    removeErrorMessage("#gene-selection  #aside-host-genes-d2");

                    // fill gene selects
                    fillGeneSelects(dataset_unpickled, phage_genes_select_d2, host_genes_select_d2, "d2"); // fill gene select 
                }else{
                    throw new Error("dataset_unpickled is empty with the result that gene select elements can not be filled");
                }
            }
            catch(error){
                console.log('Failed to fetch unpickled Data', error)

                // disable gene selects
                phage_genes_select_d2.disabled = true;
                host_genes_select_d2.disabled = true;

                // hide all spinners in gene selection div
                const gene_sel_spinners = document.querySelectorAll("#gene-selection .spinner.d2");
                gene_sel_spinners.forEach(spinner => {
                    toggleSpinner(spinner.id, false);
                });
                
                // hide phage genome parameter selections
                // const class_box = document.querySelector("#show-classification-checkbox");
                // const explore_genome_button = document.querySelector("#explore-genome-button");
                // class_box.style.display = 'none';
                // explore_genome_button.style.display = 'none';
                
                // insert error message to aside element below selects
                if(!aside_phage_genes_d2.querySelector(".error-message")){
                    aside_phage_genes_d2.insertAdjacentHTML("beforeend", `
                        <div class="error-message">
                            <sl-icon name="exclamation-triangle"></sl-icon>
                            <p>An issue occurred with gene selection. Therefore, it's currently not possible to study individual genes. Sorry.</p>
                        </div>
                    `);
                }

                if(!aside_host_genes_d2.querySelector(".error-message")){
                    aside_host_genes_d2.insertAdjacentHTML("beforeend", `
                        <div class="error-message">
                            <sl-icon name="exclamation-triangle"></sl-icon>
                            <p>An issue occurred with gene selection. Therefore, it's currently not possible to study individual genes. Sorry.</p>
                        </div>
                    `);
                }
                
            }


            // fetch data for time series plots and plot them 
            time_series_promise_d2 = fetch_time_series_data(study);

            // const aside_phage_genes = document.querySelector("#gene-selection  #aside-phage-genes");
            // const aside_host_genes = document.querySelector("#gene-selection  #aside-host-genes");

            // fill select elements for gene selection based of the unpickled dataset
            // try{
            //     const dataset_unpickled = await fetch_specific_unpickled_dataset(study,"TPM_means"); // fetch unpickled dataset             
                
            //     if(dataset_unpickled){
            //         // make gene selects interactable again
            //         phage_genes_select.disabled = false;
            //         host_genes_select.disabled = false;

            //         removeErrorMessage("#gene-selection  #aside-phage-genes");
            //         removeErrorMessage("#gene-selection  #aside-host-genes");

            //         // fill gene selects
            //         fillGeneSelects(dataset_unpickled, phage_genes_select, host_genes_select); // fill gene select 
            //     }else{
            //         throw new Error("dataset_unpickled is empty with the result that gene select elements can not be filled");
            //     }
            // }
            // catch(error){
            //     console.log('Failed to fetch unpickled Data', error)

            //     // disable gene selects
            //     phage_genes_select.disabled = true;
            //     host_genes_select.disabled = true;

            //     // hide all spinners in gene selection div
            //     const gene_sel_spinners = document.querySelectorAll("#gene-selection .spinner");
            //     gene_sel_spinners.forEach(spinner => {
            //         toggleSpinner(spinner.id, false);
            //     });
                
            //     // hide phage genome parameter selections
            //     const class_box = document.querySelector("#show-classification-checkbox");
            //     const explore_genome_button = document.querySelector("#explore-genome-button");
            //     class_box.style.display = 'none';
            //     explore_genome_button.style.display = 'none';
                
            //     // insert error message to aside element below selects
            //     if(!aside_phage_genes.querySelector(".error-message")){
            //         aside_phage_genes.insertAdjacentHTML("beforeend", `
            //             <div class="error-message">
            //                 <sl-icon name="exclamation-triangle"></sl-icon>
            //                 <p>An issue occurred with gene selection. Therefore, it's currently not possible to study individual genes. Sorry.</p>
            //             </div>
            //         `);
            //     }

            //     if(!aside_host_genes.querySelector(".error-message")){
            //         aside_host_genes.insertAdjacentHTML("beforeend", `
            //             <div class="error-message">
            //                 <sl-icon name="exclamation-triangle"></sl-icon>
            //                 <p>An issue occurred with gene selection. Therefore, it's currently not possible to study individual genes. Sorry.</p>
            //             </div>
            //         `);
            //     }
                
            // }
 
            
            // // fetch data for time series plots and plot them 
            // time_series_promise = fetch_time_series_data(study);
            // time_series_promise.then(async time_series_data => {     
                
            //     if(time_series_data){

            //         // remove error message (will be only removed if its present)
            //         removeErrorMessage("#class-timeseries-container");

            //         const time_series_data_phages = JSON.parse(time_series_data.phages); // convert phage data to json 
                    
            //         // if the datasets does not have at least 3 timepoints, disable that the user can select custom threshold
            //         const timepoints = [...new Set(time_series_data_phages.map(item=> item.Time))]; // get all timepoints

            //         const custom_threshold_option = document.querySelector("#classification-method-exploration > sl-option:nth-child(3)");

            //         if(timepoints.length <= 2){
            //             custom_threshold_option.disabled = true;
            //         }else{
            //             custom_threshold_option.disabled = false;
            //         }

            //         const classification_value = classification_select.value;

            //         if(classification_value){
            //             if(classification_value === "CustomThreshold"){
            //                 //  only fetch data and create classification chart, if all selects regarding dataset choice have a selected value and all custom threshold parameters are set
            //                 if(study_select.value && host_select.value && study_select.value && early_select.value && middle_select.value && late_select.value && threshold_input.value){
                            
            //                     const custom_threshold_data = await get_class_custom_threshold_data(study_select.value, early_select.value, middle_select.value, late_select.value, threshold_input.value);
            
            //                     createClassTimeseries(custom_threshold_data, classification_value);
            //                 }

            //             }else{
            //                 createClassTimeseries(time_series_data_phages,classification_value);
            //             }
            //         }
                

            //         // turn spinner off
            //         toggleSpinner('class-timeseries-spinner', false)

            //         // trigger change event for classification select, to initialize default value
            //         classification_select.dispatchEvent(new Event('sl-change', { bubbles: true }));
                    

            //         return time_series_data;
            //     }else{
            //         // turn spinner off
            //         toggleSpinner('class-timeseries-spinner', false)

            //         throw new Error("time_series_data is empty with the result that phage gene expression profiles can't be visualized");
            //     }
                
            // }).catch(error => {
            //     console.log('Failed to fetch data for time series graphs', error);

            //     showErrorMessage("class-timeseries-container", "phage gene expression profiles");

            //     return null; 
            // });

            initializeVisualizationsForDataset(study, phage_slider_div_d2, host_slider_div_d2, "phage-heatmap-container-d2", "host-heatmap-container-d2");
            
        }else{
            // // reset everything
            // phage_genes_select.innerHTML= '';
            // host_genes_select.innerHTML= '';

            // downloadButton.setAttribute("disabled",'')
            // const tooltip = downloadButton.parentElement; 
            // tooltip.content = "Please make your selections first";

            resetGraphs("d2");
        }
    });

    // add eventlistener for each slider

    initializeVarianceSliderEventlistener(phage_slider_div_d1, "phage", "phage-heatmap-container-d1", study_select_d1);

    initializeVarianceSliderEventlistener(host_slider_div_d1, "host", "host-heatmap-container-d1", study_select_d1);
    

    initializeVarianceSliderEventlistener(phage_slider_div_d2, "phage", "phage-heatmap-container-d2", study_select_d2);

    initializeVarianceSliderEventlistener(host_slider_div_d2, "host", "host-heatmap-container-d2", study_select_d2);

    

    // eventlistener for phage gene select
    phage_genes_select_d1.addEventListener('sl-change',async () => {
        const selectedPhageGenes = phage_genes_select_d1.value;

        const time_series_data = await time_series_promise_d1; // await time series data promise

        // create gene time series plot and gene heatmaps
        if (time_series_data){

            // create gene time series and hide spinner
            try {
                createGeneTimeseries(time_series_data.phages, selectedPhageGenes,"phage-genes-timeseries-container-d1", "d1");
            } catch (error) {
                console.log('Failed to create gene timeseries', error);         
                showErrorMessage("phage-genes-timeseries-container-d1", "phage gene expression profiles");
            }  
            toggleSpinner('phage-genes-timeseries-spinner-d1', false)
        }

        // create gene heatmaps and hide spinner
        createGeneHeatmaps(study_select_d1.value, selectedPhageGenes, 'phage', "phage-gene-heatmap-container-d1" );
        toggleSpinner('phage-genes-heatmap-spinner-d1', false);

        // //create genome view

        // // get selected phage
        // const selected_phage = phage_select_d1.shadowRoot.querySelector('input').value;

        // const genome_name = await fetch_genome_name_with_organism_name(selected_phage, 'phage');

        // const assembly_etc = await get_assembly_maxEnd(genome_name, "phage");

        // const classification_value = classification_select.value;

        // if(classification_value === "CustomThreshold"){
        //     if(study_select.value && early_select.value && middle_select.value && late_select.value && threshold_input.value){

        //         // create genome view with the custom threshold gene classification
        //         createGenomeView(`/fetch_specific_phage_genome_with_custom_threshold/${genome_name}/${study_select.value}/${early_select.value}/${middle_select.value}/${late_select.value}/${threshold_input.value}`, document.getElementById("phage-genome"), classification_value,selectedPhageGenes, showClassification,assembly_etc);
        //     }


        // }else{
        
        //     if(study_select.value){
        //         // create genome view with ClassMax or ClassThreshold (in classification_value variable)
        //         createGenomeView(`/fetch_specific_genome/${genome_name}/${study_select.value}/phage`, document.getElementById("phage-genome"), classification_value, selectedPhageGenes, showClassification, assembly_etc);
        //     }
            
        // }
        // toggleSpinner("phage-genome-spinner", false);


    });

    // eventlistener for host gene select
    host_genes_select_d1.addEventListener('sl-change',async () => {

        const selectedHostGenes = host_genes_select_d1.value;

        const time_series_data = await time_series_promise_d1; // await time series data promise
        
        if (time_series_data){

            // create gene time series and hide spinner
            createGeneTimeseries(time_series_data.hosts, selectedHostGenes,"host-genes-timeseries-container-d1", "d1");

            toggleSpinner('host-genes-timeseries-spinner-d1', false);
        }

        // create gene heatmaps and hide spinner
        createGeneHeatmaps(study_select_d1.value, selectedHostGenes, 'host', "host-gene-heatmap-container-d1" );
        toggleSpinner('host-genes-heatmap-spinner-d1', false);

        // get host id of selected host
        // NOTE: commented out because Host genome makes the whole page freeze until rendering -> if it should be included again, do the same for css (.genome-container & HTML container)
        // const selected_host = host_select.shadowRoot.querySelector('input').value;

        // const genome_name = await fetch_genome_name_with_organism_name(selected_host, 'host');

        // const assembly_etc = await get_assembly_maxEnd(genome_name, "host");

        // if(host_select.value){
        //     createGenomeView(`/fetch_specific_genome/${genome_name}/${study_select.value}/host`, document.getElementById("host-genome"), "ClassMax", selectedHostGenes, false, assembly_etc);
        // }
        

        // toggleSpinner("host-genome-spinner", false)
    });

    phage_genes_select_d2.addEventListener('sl-change',async () => {
        const selectedPhageGenes = phage_genes_select_d2.value;

        const time_series_data = await time_series_promise_d2; // await time series data promise

        // create gene time series plot and gene heatmaps
        if (time_series_data){

            // create gene time series and hide spinner
            try {
                createGeneTimeseries(time_series_data.phages, selectedPhageGenes,"phage-genes-timeseries-container-d2", "d2");
            } catch (error) {
                console.log('Failed to create gene timeseries', error);         
                showErrorMessage("phage-genes-timeseries-container-d2", "phage gene expression profiles");
            }  
            toggleSpinner('phage-genes-timeseries-spinner-d2', false)
        }

        // create gene heatmaps and hide spinner
        createGeneHeatmaps(study_select_d2.value, selectedPhageGenes, 'phage', "phage-gene-heatmap-container-d2" );
        toggleSpinner('phage-genes-heatmap-spinner-d2', false);

        // //create genome view

        // // get selected phage
        // const selected_phage = phage_select_d1.shadowRoot.querySelector('input').value;

        // const genome_name = await fetch_genome_name_with_organism_name(selected_phage, 'phage');

        // const assembly_etc = await get_assembly_maxEnd(genome_name, "phage");

        // const classification_value = classification_select.value;

        // if(classification_value === "CustomThreshold"){
        //     if(study_select.value && early_select.value && middle_select.value && late_select.value && threshold_input.value){

        //         // create genome view with the custom threshold gene classification
        //         createGenomeView(`/fetch_specific_phage_genome_with_custom_threshold/${genome_name}/${study_select.value}/${early_select.value}/${middle_select.value}/${late_select.value}/${threshold_input.value}`, document.getElementById("phage-genome"), classification_value,selectedPhageGenes, showClassification,assembly_etc);
        //     }


        // }else{
        
        //     if(study_select.value){
        //         // create genome view with ClassMax or ClassThreshold (in classification_value variable)
        //         createGenomeView(`/fetch_specific_genome/${genome_name}/${study_select.value}/phage`, document.getElementById("phage-genome"), classification_value, selectedPhageGenes, showClassification, assembly_etc);
        //     }
            
        // }
        // toggleSpinner("phage-genome-spinner", false);


    });

    // eventlistener for host gene select
    host_genes_select_d2.addEventListener('sl-change',async () => {

        const selectedHostGenes = host_genes_select_d2.value;

        const time_series_data = await time_series_promise_d2; // await time series data promise
        
        if (time_series_data){

            // create gene time series and hide spinner
            createGeneTimeseries(time_series_data.hosts, selectedHostGenes,"host-genes-timeseries-container-d2", "d2");

            toggleSpinner('host-genes-timeseries-spinner-d2', false);
        }

        // create gene heatmaps and hide spinner
        createGeneHeatmaps(study_select_d2.value, selectedHostGenes, 'host', "host-gene-heatmap-container-d2" );
        toggleSpinner('host-genes-heatmap-spinner-d2', false);

        // get host id of selected host
        // NOTE: commented out because Host genome makes the whole page freeze until rendering -> if it should be included again, do the same for css (.genome-container & HTML container)
        // const selected_host = host_select.shadowRoot.querySelector('input').value;

        // const genome_name = await fetch_genome_name_with_organism_name(selected_host, 'host');

        // const assembly_etc = await get_assembly_maxEnd(genome_name, "host");

        // if(host_select.value){
        //     createGenomeView(`/fetch_specific_genome/${genome_name}/${study_select.value}/host`, document.getElementById("host-genome"), "ClassMax", selectedHostGenes, false, assembly_etc);
        // }
        

        // toggleSpinner("host-genome-spinner", false)
    });


    // // eventlistener for the classification select element, that changes the classification based on the selected Value
    // classification_select.addEventListener('sl-change', async(event) => {
    //     const classification_value = event.target.value;
    //     const time_series_data = await time_series_promise; 
    //     const data = time_series_data.phages;
    //     const custom_div = document.querySelector(".custom-threshold-container");

    //     // remove error message (will be only removed if its present)
    //     removeErrorMessage("#class-timeseries-container");
    //     removeErrorMessage("#phage-genome");
        
    //     if(classification_value === "CustomThreshold"){
        
       
    //         // get all classification selects 
    //         const early_select = document.getElementById("early-select");
    //         const middle_select = document.getElementById("middle-select");
    //         const late_select = document.getElementById("late-select");
    //         const threshold_input = document.getElementById("custom-threshold");


    //         if(early_select.value && middle_select.value && late_select.value){
    //             custom_div.style.display = "flex"; // show custom threshold container

    //             // update classtime series plot and genome view based on custom threshold
    //             await updateCustomThresholdView(
    //                 study_select.value,
    //                 classification_value,
    //                 early_select.value,
    //                 middle_select.value,
    //                 late_select.value,
    //                 threshold_input.value
    //             );

                

    //         }else{

    //             const all_options = custom_div.querySelectorAll("sl-option");

    //             // if the selects are not yet filled with options (=> all_options is empty), we will fill them
    //             if(!all_options.length){

    //                 const data_json = JSON.parse(data); // convert data to json 
    //                 const timepoints = [...new Set(data_json.map(item=> item.Time))]; // get all timepoints

                   
                 
                    
    //                 // loop through all 3 selects to fill them with timepoints as options
    //                 [early_select, middle_select, late_select].forEach(select => {

    //                     timepoints.forEach(t => {
    //                         if(t === "Ctrl"){
    //                             t = -1;
    //                         }
    //                         const option = document.createElement("sl-option");
    //                         option.textContent = t;
    //                         option.value = t; 

    //                         select.appendChild(option);
    //                     });

    //                 });
    //             }

    //             // add eventlisteners for each select 
    //             early_select.addEventListener('sl-change', async(event) =>{
    //                 let value = event.target.value;

    //                 // fetch options of middle and late selects 
    //                 const middle_options = middle_select.querySelectorAll("sl-option");
    //                 const late_options = late_select.querySelectorAll("sl-option");
                
    //                 if(value !== ""){
    //                     value = Number(event.target.value);

    //                     middle_options.forEach(opt => {
    //                         const optValue = Number(opt.value);

    //                         if (optValue <= value){
    //                             opt.disabled = true;
    //                         }

    //                     });

    //                     late_options.forEach(opt => {
    //                         const optValue = Number(opt.value);

    //                         if (optValue <= value){
    //                             opt.disabled = false;
    //                         }

    //                     });

    //                     //  only fetch data and create classification chart, if all selects regarding dataset choice have a selected value and all custom threshold parameters are set
    //                     if(study_select.value && host_select.value && value && middle_select.value && late_select.value && threshold_input.value){
    //                         await updateCustomThresholdView(study_select.value, classification_value, value, middle_select.value, late_select.value, threshold_input.value);
    //                     }


    //                 }else{

    //                     // if no value, show all options that are disabled again by removing the disabled attribute
    //                     late_options.forEach(opt => {
    //                         const optValue = Number(opt.value);
                        
    //                         // if the option is disabled, handle it
    //                         if (opt.hasAttribute("disabled")){

    //                             // handle the cases in which early select still has a value selected 
    //                             if(middle_select.value){

    //                                 // only reset the disabeling for those that are bigger than the middle_select value
    //                                 if(optValue > middle_select.value ){
    //                                     opt.disabled = false;
    //                                 }
    //                             }else{
    //                                 // if no early boundary is selected, reset the disabeling for all options
    //                                 opt.disabled = false;
    //                             }
                                
    //                         }
    //                     });

    //                     middle_options.forEach(opt => {
    //                         const optValue = Number(opt.value);
                        
    //                         // if the option is disabled, handle it
    //                         if (opt.hasAttribute("disabled")){

    //                             // handle the cases in which late select still has a value selected 
    //                             if(late_select.value){

    //                                 // only reset the disabeling for those that are smaller than the late_select value
    //                                 if(optValue < late_select.value ){
    //                                     opt.disabled = false;
    //                                 }
    //                             }else{
    //                                 // if no late boundary is selected, reset the disabeling for all options
    //                                 opt.disabled = false;
    //                             }
                                
    //                         }
    //                     });


                        
    //                 }
                    
                        
    //             })

    //             middle_select.addEventListener('sl-change', async(event) =>{
    //                 let value = event.target.value;

    //                 const late_options = document.querySelectorAll("#late-select sl-option");
    //                 const early_options = document.querySelectorAll("#early-select sl-option");

    //                 if(value !== ""){
    //                     value = Number(event.target.value);

    //                     late_options.forEach(opt => {
    //                         const optValue = Number(opt.value);
                        
    //                         if (optValue <= value){
    //                             opt.disabled = true;
    //                         }
    //                     });

    //                     early_options.forEach(opt => {
    //                         const optValue = Number(opt.value);
                        
    //                         if (optValue >= value){
    //                             opt.disabled = true;
    //                         }
    //                     });
                        

    //                     //  only fetch data and create classification chart, if all selects regarding dataset choice have a selected value and all custom threshold parameters are set
    //                     if(study_select.value && host_select.value && early_select.value && value && late_select.value && threshold_input.value){
    //                         await updateCustomThresholdView(study_select.value, classification_value, early_select.value, value, late_select.value, threshold_input.value);
    //                     }

    //                 }else{
    //                     // if no value, show all options that are disabled again by removing the disabled attribute
    //                     late_options.forEach(opt => {
    //                         const optValue = Number(opt.value);
                        
    //                         // if the option is disabled, handle it
    //                         if (opt.hasAttribute("disabled")){

    //                             // handle the cases in which early select still has a value selected 
    //                             if(early_select.value){

    //                                 // only reset the disabeling for those that are bigger than the early_select value
    //                                 if(optValue > early_select.value ){
    //                                     opt.disabled = false;
    //                                 }
    //                             }else{
    //                                 // if no early boundary is selected, reset the disabeling for all options
    //                                 opt.disabled = false;
    //                             }
                                
    //                         }
    //                     });

    //                     early_options.forEach(opt => {
    //                         const optValue = Number(opt.value);
                        
    //                         // if the option is disabled, handle it
    //                         if (opt.hasAttribute("disabled")){

    //                             // handle the cases in which late select still has a value selected 
    //                             if(late_select.value){

    //                                 // only reset the disabeling for those that are smaller than the late_select value
    //                                 if(optValue < late_select.value ){
    //                                     opt.disabled = false;
    //                                 }
    //                             }else{
    //                                 // if no late boundary is selected, reset the disabeling for all options
    //                                 opt.disabled = false;
    //                             }
                                
    //                         }
    //                     });
                        
    //                 }

                    
    //             });


    //             late_select.addEventListener('sl-change', async(event) =>{
    //                 let value = event.target.value;

    //                 if(value !== ""){
    //                     value = Number(event.target.value);
    //                 }

    //                 const middle_options = document.querySelectorAll("#middle-select sl-option");
    //                 const early_options = document.querySelectorAll("#early-select sl-option");

    //                 if(value !== ""){
                        
    //                     middle_options.forEach(opt => {
    //                         const optValue = Number(opt.value);
                        
    //                         if (optValue >= value){
    //                             opt.disabled = true;
    //                         }
    //                     });

    //                     early_options.forEach(opt => {
    //                         const optValue = Number(opt.value);
                        
    //                         if (optValue >= value){
    //                             opt.disabled = true;
    //                         }
    //                     });
                        

    //                     //  only fetch data and create classification chart, if all selects regarding dataset choice have a selected value and all custom threshold parameters are set
    //                     if(study_select.value && host_select.value && early_select.value && middle_select.value && value && threshold_input.value){
                        
    //                         await updateCustomThresholdView(study_select.value, classification_value, early_select.value, middle_select.value, value, threshold_input.value);
    //                     }

    //                 }else{
    //                     // if no value, show all options that are disabled again by removing the disabled attribute
    //                     middle_options.forEach(opt => {
    //                         const optValue = Number(opt.value);
                        
    //                         // if the option is disabled, handle it
    //                         if (opt.hasAttribute("disabled")){

    //                             // handle the cases in which early select still has a value selected 
    //                             if(early_select.value){

    //                                 // only reset the disabeling for those that are bigger than the early_select value
    //                                 if(optValue > early_select.value ){
    //                                     opt.disabled = false;
    //                                 }
    //                             }else{
    //                                 // if no early boundary is selected, reset the disabeling for all options
    //                                 opt.disabled = false;
    //                             }
                                
    //                         }
    //                     });

    //                     early_options.forEach(opt => {
    //                         const optValue = Number(opt.value);
                        
    //                         // if the option is disabled, handle it
    //                         if (opt.hasAttribute("disabled")){

    //                             // handle the cases in which late select still has a value selected 
    //                             if(middle_select.value){

    //                                 // only reset the disabeling for those that are smaller than the middle_select value
    //                                 if(optValue < middle_select.value ){
    //                                     opt.disabled = false;
    //                                 }
    //                             }else{
    //                                 // if no middle boundary is selected, reset the disabeling for all options
    //                                 opt.disabled = false;
    //                             }
                                
    //                         }
    //                     });
                        
    //                 }

                    
    //             });

    //             threshold_input.addEventListener('sl-input', async(event) => {
    //                 const value = event.target.value;

    //                 if(value !== ""){
    //                     //  only fetch data and create classification chart, if all selects regarding dataset choice have a selected value and all custom threshold parameters are set
    //                     if(study_select.value && host_select.value && study_select.value && early_select.value && middle_select.value && late_select.value && value){
                            
    //                         await updateCustomThresholdView(study_select.value, classification_value, early_select.value, middle_select.value, late_select.value, value);
    //                     }

    //                 }
                    
    //             });
                
    //             custom_div.style.display = "flex"; // show custom threshold container
    //         } 

    //     }else{
    //         custom_div.style.display = "none"; // hide custom threshold container

    //         //  only create Classification chart, if all selects regarding dataset choice have a selected value
    //         if(study_select.value && host_select.value && study_select.value){
    //             await updateStandardView(study_select.value, classification_value, data);
    //         }
 
    //     }
    // });
    
    

  


    //#endregion
  

}



/**
 * Function to trigger a clear event for the select elements
 */
function triggerClearEvent(container_id){
    const selectors = document.querySelectorAll(`#${container_id} .selector.single`);
    
    selectors.forEach(selector => {
        // clear selections
        selector.setAttribute("value", "")
        selector.shadowRoot.querySelector('input').value = "";
        
        if (!selector.id.includes("phages-select")){
            resetOptions(selector.id)
        }
        
        // dispatch an "sl-change" event to trigger event listeners
        selector.dispatchEvent(new Event('sl-change', { bubbles: true }));
    })

    // //reset classification selection
    // const classification_method = document.getElementById("classification-method-exploration");
    // classification_method.value = "ClassMax";

    // resetOptions("hosts-select"); // reset options
    // resetOptions("studies-select"); // reset options
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
 * Function that resets all graphs, by creating either an empty graph, or in case of genome maps, hiding it
 * @param {string} dataset - d1 or d2
 */
function resetGraphs(dataset){
    const graph_container = document.querySelectorAll(`.graph-container.${dataset}`);

    graph_container.forEach(container => {
        container.innerHTML = "";

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
        // fillOptions(study_select, studies, studies[0]);  seems to be not necessary to to the update selection in host_select eventlistener
    }
}

/**
 * Function to fill a single selector for Phage-Host Interaction
 * @param {sl-select} select - select element.
 * @param {string[]} options - Options for the select element.
 * @param {string} defaultValue - Default Value for the select element.
 * @param {string} dataset - d1, d2 or null
 */
function fillOptions(select, options, defaultValue, dataset = null) {

    // clear existing options
    select.innerHTML = ''; 

    // if its a multiple select emlement add select and deselect buttons
    if (select.hasAttribute('multiple')){
        select.innerHTML = `<div class="options-config">
                        <sl-button size="small" class="select-all-button select-deselect-buttons ${dataset}" pill>
                            <sl-icon slot="prefix" name="check"> </sl-icon>
                            Select all
                        </sl-button>
                        <sl-button size="small" class="deselect-all-button select-deselect-buttons ${dataset}" pill>
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
 * Function that hides all configuration options if none of the selects are chosen 
 * and performs different tasks that run only if all selects are filled
 * @param {string} dataset - d1 or d2
 */
function processAfterFilledSelects(dataset){
    const phage_select = document.getElementById(`phages-select-${dataset}`);
    const host_select = document.getElementById(`hosts-select-${dataset}`);
    const study_select = document.getElementById(`studies-select-${dataset}`);

    const slider_hosts = document.getElementById(`slider-hosts-${dataset}`);
    const slider_phages = document.getElementById(`slider-phages-${dataset}`);
    // const class_box = document.querySelector("#show-classification-checkbox");
    // const explore_genome_button = document.querySelector("#explore-genome-button");

    if(phage_select.value && host_select.value && study_select.value) {
        // show config options
        slider_hosts.style.display = 'block';
        slider_phages.style.display = 'block';
        // class_box.style.display = 'block';
        // explore_genome_button.style.display = 'flex';
        
    } else {
        // hide config options
        slider_hosts.style.display = 'none';
        slider_phages.style.display = 'none';
        // class_box.style.display = 'none';
        // explore_genome_button.style.display = 'none';
    }
}


/**
 * Displays an error message inside a specified container element.
 * 
 * @param {string} containerId - The ID of the DOM element where the error message should be shown.
 * @param {string} vizWithError - The visualization that has an error (e.g.Phage Heatmap).
 */
function showErrorMessage(containerId, vizWithError) {
    const container = document.getElementById(containerId);
    if (container && !container.querySelector(".error-message") ) {
        container.innerHTML = `
            <div class="error-message">
                <sl-icon name="exclamation-triangle"></sl-icon>
                <p>
                    Sorry, unfortunately the ${vizWithError} couldn’t be displayed due to an internal error.
                    <br>
                    <br>
                    You can still download the data from the left panel for your own visualization.
                    <br>
                    <br>
                    If this issue persists, feel free to contact us.
                </p>
            </div>
        `;
    }
}

/**
 * Removes an error message inside a specified container element.
 * 
 * @param {string} containerQuery - The query string of the DOM element where the error message should be shown.
 */
function removeErrorMessage(containerQuery){
    const container = document.querySelector(containerQuery);
    
    const errorMessage = container.querySelector(".error-message");

    if(errorMessage){
        container.removeChild(errorMessage);
    }
}

/**
 * Function to update single selectors options for Phage-Host Interaction
 * @param {Dataset[]} datasets - Array of Datasets.
 * @param {sl-select} phage_select - Select element for Phages.
 * @param {sl-select} host_select - Select element for Hosts.
 * @param {sl-select} study_select - Select element for Studies.
 * @param {string} dataset  - d1 or d2.
 */
function updateSelections(datasets, phage_select, host_select, study_select, changedSelect, dataset) {
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
                resetGraphs(dataset);
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
                resetGraphs(dataset);
            }
            
        } else {
            fillOptions(host_select, hosts_filtered, null);
            fillOptions(study_select, studies_filtered, null);
        }
    }
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
 * Function that extracts all values with a given key from a dataset and returns an array of unique values.
 * @param {Dataset[]} dataset - Array of Datasets
 * @param {String} key - String
 * @returns {String[]} - filtered Dataset
 */
function getUniqueValues(dataset, key) {
    return [...new Set(dataset.map(item => item[key]))];
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

    const dataset = document.getElementById("studies-select-d1");

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


async function initializeVarianceSlider(phage_slider_div, host_slider_div, study){
    // get all elements 
    const right_slider_phages = phage_slider_div.querySelector(".right-slider");
    const left_slider_phages = phage_slider_div.querySelector(".left-slider");
    const max_input_field_phages = phage_slider_div.querySelector(".max-input-field");
    const min_input_field_phages = phage_slider_div.querySelector(".min-input-field");

    const right_slider_hosts = host_slider_div.querySelector(".right-slider");
    const left_slider_hosts = host_slider_div.querySelector(".left-slider");
    const max_input_field_hosts = host_slider_div.querySelector(".max-input-field");
    const min_input_field_hosts = host_slider_div.querySelector(".min-input-field");


    // update variance double range slider (phage and host heatmap (big) based on host and phage size (number of genes))
    try {
        
        // fetch phage and host gene size 
        const size_dict = await get_host_phage_size(study)

        if(size_dict){
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
        }else{
            throw new Error("Failed to get host and phage gene size");
        }
    } catch (error) {
        console.log('Failed to get host and phage gene size', error);

        // hide sliders, because gene size for filtering is not available
        phage_slider_div.style.display = "none";
        host_slider_div.style.display = "none";
    }
    
}



/**
 * Function initializes the eventlistener for a variance slider
 * @param {*} slider_div - HTML Element (div) of the variance slider. 
 * @param {string} type - "phage" or "host".
 * @param {string} heatmapContainerId - ID of the container where the heatmap should be placed in after changes are made with the slider.
 * @param {HTML Element} study_select - select element for dataset/study.
 */
async function initializeVarianceSliderEventlistener(slider_div, type, heatmapContainerId, study_select){

    // get all elements 
    const right_slider = slider_div.querySelector(".right-slider");
    const left_slider = slider_div.querySelector(".left-slider");
    const max_input_field = slider_div.querySelector(".max-input-field");
    const min_input_field = slider_div.querySelector(".min-input-field");

    updateRangeFill(left_slider, right_slider);

    left_slider.addEventListener('input',async(event) =>{
        let value = event.target.value;
       
        if (value >= parseInt(right_slider.value)){
            value = parseInt(right_slider.value) - 2;
            left_slider.value= value;
        }

        updateRangeFill(left_slider, right_slider);
        min_input_field.value = value;
    });

    right_slider.addEventListener('input',(event) =>{
        let value = event.target.value;

        if(value <= parseInt(left_slider.value)){
            value = parseInt(left_slider.value) + 2;
            right_slider.value = value;
        }
        updateRangeFill(left_slider, right_slider);
        max_input_field.value = value;
    });


    // eventlistener for the number input fields or the double range sliders 
    // that listens for changes and updates the slider accordingly
    min_input_field.addEventListener('input',(event) => {
        let value = event.target.value;
        if(value === ""){
            value = 0;
        }
        if (value >= parseInt(max_input_field.value)){
            value = parseInt(max_input_field.value) - 2;
            min_input_field.value = value;
        }
        left_slider.value = value;
        updateRangeFill(left_slider, right_slider);

        left_slider.dispatchEvent(new Event('change', { bubbles: false }))
    });

    max_input_field.addEventListener('input',(event) => {
        let value = event.target.value;

        if (value <= parseInt(min_input_field.value)){
            value = parseInt(min_input_field.value) + 2;
            max_input_field.value = value;
        }
        right_slider.value = value;
        updateRangeFill(left_slider, right_slider);

        right_slider.dispatchEvent(new Event('change', { bubbles: false }))
    });


    
    // on left slider change, update the heatmap data 
    left_slider.addEventListener('change', async(event) => {

        const vals = [parseInt(event.target.value), parseInt(right_slider.value)];

        let heatmap_data;
        if(type === "phage"){
            
            heatmap_data = await fetch_phage_heatmap_data(study_select.value, vals,null)

        }else if(type === "host"){
            heatmap_data = await fetch_host_heatmap_data(study_select.value, vals,null)
        }

        createInteractionHeatmap(heatmap_data, heatmapContainerId);
    })
    // on right slider change, update the heatmap data 
    right_slider.addEventListener('change', async(event) => {

        const vals = [parseInt(left_slider.value), parseInt(event.target.value)]

        let heatmap_data;

        if(type === "phage"){
            
            heatmap_data = await fetch_phage_heatmap_data(study_select.value, vals,null)

        }else if(type === "host"){
            heatmap_data = await fetch_host_heatmap_data(study_select.value, vals,null)
        }


        createInteractionHeatmap(heatmap_data, heatmapContainerId);
    });

}


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

async function initializeVisualizationsForDataset(study, slider_div_phage, slider_div_host, phageHeatmapContainerId, hostHeatmapContainerId){

    // get variance sliders for heatmaps
    const right_slider_phage = slider_div_phage.querySelector(".right-slider");
    const left_slider_phage = slider_div_phage.querySelector(".left-slider");

    const right_slider_host = slider_div_host.querySelector(".right-slider");
    const left_slider_host = slider_div_host.querySelector(".left-slider");


    // retrieve values from sliders
    const vals_phage = [parseInt(left_slider_phage.value), parseInt(right_slider_phage.value)];

    const vals_host = [parseInt(left_slider_host.value), parseInt(right_slider_host.value)];


    // fetch host and phage heatmap data based on the min max values 
    const results = await Promise.allSettled([
        fetch_host_heatmap_data(study, vals_host, null),
        fetch_phage_heatmap_data(study, vals_phage, null)
    ]);

    const heatmap_data_host = results[0].status === 'fulfilled' ? results[0].value : null;
    const heatmap_data_phage = results[1].status === 'fulfilled' ? results[1].value : null;

    // get spinner id
    const phageSpinnerID = slider_div_phage.parentElement.nextElementSibling.firstElementChild.id; 
    const hostSpinnerID = slider_div_host.parentElement.nextElementSibling.firstElementChild.id; 

    if(heatmap_data_phage){
        // clean container (in case that an error message is present)
        document.getElementById(phageHeatmapContainerId).innerHTML = "";

        // create the heatmap
        createInteractionHeatmap(heatmap_data_phage, phageHeatmapContainerId);


        // hide spinner for host heatmap
        toggleSpinner(phageSpinnerID, false); 
    } else{
        // hide spinner for host heatmap
        toggleSpinner(phageSpinnerID, false); 

        // hide phage slider
        slider_div_phage.style.display = 'none';

        // show error message inside graph container to visualize that an error occured
        showErrorMessage(phageHeatmapContainerId, "phage heatmap");
    }

    if(heatmap_data_host){
        // clean container (in case that an error message is present)
        document.getElementById(hostHeatmapContainerId).innerHTML = "";

        // create the heatmap
        createInteractionHeatmap(heatmap_data_host, hostHeatmapContainerId);

        // hide spinner for host heatmap
        toggleSpinner(hostSpinnerID, false); 
    }
    else{
        // hide spinner for host heatmap
        toggleSpinner(hostSpinnerID, false); 

        // hide host slider
        slider_div_host.style.display = 'none';

        // show error message inside graph container to visualize that an error occured
        showErrorMessage(hostHeatmapContainerId, "host heatmap");
    }




}


/**
 * Function that fills the Gene Selects
 * @param {Dataset} dataset - Dataset.
 * @param {sl-select} phage_genes_select - Shoelace's select element for phage genes.
 * @param {sl-select} host_genes_select - Shoelace's select element for host genes.
 * @param {string} d - d1 or d2.
 */
function fillGeneSelects(dataset, phage_genes_select, host_genes_select, d){

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
    const selectAllButtonPhages = document.querySelector(`#phage-genes-select-${d} .select-all-button`);
    const selectAllButtonHosts = document.querySelector(`#host-genes-select-${d} .select-all-button`);

    selectAllButtonPhages.addEventListener('click', () => {
        const options = Array.from(phage_genes_select.querySelectorAll('sl-option')).map(option => option.value);

        setValueAndTriggerChange(phage_genes_select, options);
    });

    selectAllButtonHosts.addEventListener('click', () => {
        const options = Array.from(host_genes_select.querySelectorAll('sl-option')).map(option => option.value);

        setValueAndTriggerChange(host_genes_select, options);
    });

    const deselectAllButtonPhages = document.querySelector(`#phage-genes-select-${d} .deselect-all-button`);
    const deselectAllButtonHosts = document.querySelector(`#host-genes-select-${d} .deselect-all-button`);

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
 * Function created time series plot of phage and host genes
 * @param {String} data - data.
 * @param {String[]} selectedGenes - Array of selected Genes.
 * @param {String} container - Container for Plot.
 * @param {*} d - d1 or d2. 
 */
function createGeneTimeseries(data, selectedGenes, container, d){

    
    removeErrorMessage(`#${container}`); // remove error message if it exists

    // parse data to JSON
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

    const dataset = document.getElementById(`studies-select-${d}`);

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

    try {
        Plotly.newPlot(container, traces, layout, config);
    } catch (error) {
        showErrorMessage(container, "Plotly visualization");
    }
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

        if(data){
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

        }

    } else if (type === 'host'){
    
        // fetch host heatmap data
        data = await fetch_host_heatmap_data(study, null, selectedGenes)

        if(data){
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
    }

    if(data){
        // create heatmap
        createHeatmap(data, container, true);
    }else{
        showErrorMessage(container, "gene heatmap")
    }
    
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