/**
 * Function to initialize the Genome Viewer
 */
export async function initializeViewerPage(){
    console.log("Viewer loaded")

    const dataset_pickled = await fetch_specific_unpickled_dataset('Leskinen_2016', 'TPM_means');

    const graph_data = await fetch_graph_data('Wolfram-Schauerte_2022', 'TPM_means')

    const data = graph_data.heatmap_data
    const dendrogram = JSON.parse(data.phage_data.dendrogram).data


    var data_phages = [{
        z: data.phage_data.z,
        x: data.phage_data.x,
        y: data.phage_data.y,
        type: 'heatmap',
        colorscale: 'Viridis',
        coloraxis: 'coloraxis'
    }]

    var layout = {
        title: 'Heatmap with Categorical Axes',
        xaxis: {
            title: 'Category X',
            type: 'category',
            tickmode: 'array', 
            ticktext: data.x 
        },
        yaxis: {
            title: 'Time [min]',
            type: 'category',
            tickmode: 'array', 
            ticktext: data.y 
        },
        coloraxis: {
            cmin: -1.5, 
            cmax: 1.5, 

        }
    };


    Plotly.newPlot('heatmap-phages', data_phages, layout)

 
    console.log(dataset_pickled);

    const datasets_pickled_TPM = await fetch_pickled_datasets_TPM_only();

    console.log(datasets_pickled_TPM);

    const select = document.getElementById("test-select")

    const opt1 = document.createElement('sl-option');
    opt1.value = "option1";
    opt1.textContent = "option1";
    select.appendChild(opt1);

    const opt2 = document.createElement('sl-option');
    opt2.value = "option_2";
    opt2.textContent = "option2";
    select.appendChild(opt2);

    const opt3 = document.createElement('sl-option');
    opt3.value = "option3";
    opt3.textContent = "option3";
    select.appendChild(opt3);

    
    async function setValueAndTriggerChange(value) {
        await select.updateComplete;  // Wait for Shoelace to render the component
        select.value = value.replace(/\s+/g, '_');
        select.shadowRoot.querySelector('input').value = value;
    
        // Dispatch an "sl-change" event to trigger event listeners
        const event = new Event('sl-change', { bubbles: true });
        select.dispatchEvent(event);
    }

    setTimeout(() => {
        setValueAndTriggerChange('option 2');
    }, 10);

    // setValueAndTriggerChange('option2');
    

    



    select.addEventListener('sl-change', (event) => {
        var selectValue = event.target.value
        console.log(selectValue);
    })

}
