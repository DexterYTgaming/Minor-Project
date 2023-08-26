function readDataFromCsv(data, dataColArr, state, nationalName) {
    let dataDict = {};

    if (state != nationalName) {
        data = data.filter(d => d["State"] == state);
    }

    data.forEach(function(d) {
        let colName = "";

        if (d.Year in dataDict){

            for (let i = 0; i < dataColArr.length; i++) {
                colName = dataColArr[i];
                dataDict[d.Year][i].push(+d[colName]);
            }
        }else{
            let colArr = [];
            for (let i = 0; i < dataColArr.length; i++) {
                colName = dataColArr[i];
                colArr.push([+d[colName]]);
            }
            dataDict[d.Year] = colArr;
        }

    });

    let yearsArr = d3.keys(dataDict);

    for (let i = 0; i < yearsArr.length; i++) {
        let year = yearsArr[i];
        let yearData = dataDict[year];

        for (let j = 0; j < yearData.length; j++) {
            let colData = yearData[j];

            let sum = 0.0;
            for (let k = 0; k < colData.length; k++) {
                sum += colData[k];
            }

            let avg = sum / colData.length;
            dataDict[year][j] = avg.toFixed(2);
        }
    }
    return dataDict;
}

function drawLineChart(id_name, dataDict, dataColArr, stateName) {
    let chartTitle = "Crime Trend in " + stateName;
    let yAxisTitle = "# of Reported Offenses per 100,000 Population";

    // create data set on our data
    let dataSet = anychart.data.set(getData(dataDict));

    let seriesDataArr = [];

    for (let i = 1; i <= dataColArr.length; i++) {
        let seriesData = dataSet.mapAs({
        'x': 0,
        'value': i
        });
        seriesDataArr.push(seriesData);
    }

    // create line chart
    let chart = anychart.line();

    // turn on chart animation
    chart.animation(true);

    // set chart padding
    chart.padding([10, 20, 5, 20]);

    // turn on the crosshair
    chart.crosshair()
    .enabled(true)
    .yLabel(false)
    .yStroke(null);

    // set tooltip mode to point
    chart.tooltip().positionMode('point');

    // set chart title text settings
    chart.title(chartTitle);

    // set yAxis title
    chart.yAxis().title(yAxisTitle);
    chart.xAxis().labels().padding(5);

    for (let i = 0; i < seriesDataArr.length; i++) {

        let series = chart.line(seriesDataArr[i]);

        let rawColName = dataColArr[i];
        let start_i = rawColName.lastIndexOf(".");

        series.name(rawColName.slice(start_i+1, rawColName.length));

        series.hovered().markers()
        .enabled(true)
        .type('circle')
        .size(4);

        series.tooltip()
        .position('right')
        .anchor('left-center')
        .offsetX(5)
        .offsetY(5);
    }

    // turn the legend on
    chart.legend()
    .enabled(true)
    .fontSize(13)
    .padding([0, 0, 10, 0]);

    // set container id for the chart
    chart.container(id_name);
    // initiate chart drawing
    chart.draw();
    // return chart;
}

function getData(dataDict) {
    let resultArr = [];
    let yearsArr = d3.keys(dataDict);
    for (let i = 0; i < yearsArr.length; i++) {
        let tmpArr = [];
        let year = yearsArr[i];
        tmpArr.push(year);

        let yearData = dataDict[year];
        for (let j = 0; j < yearData.length; j++) {
            tmpArr.push(yearData[j]);
        }
        resultArr.push(tmpArr);
    }
    return resultArr;
    // return [
    // ['1986', 3.6, 2.3, 2.8, 11.5],
    // ['1987', 7.1, 4.0, 4.1, 14.1],
    // ['1988', 8.5, 6.2, 5.1, 17.5],
    // ['1989', 9.2, 11.8, 6.5, 18.9]
    // ]
}

function getStateNames(data) {
    let stateSet = new Set();
    data.forEach(function(d) {
        stateSet.add(d.State);
    });
    return Array.from(stateSet);
}

function updateLineChart(lineChartIdName, data, dataColArr, nationalName, $dom){
    $( "#"+lineChartIdName).empty();
    let state_id_name = $dom.attr("id");
    let stateName = state_id_name.split("_")[1];
    console.log(stateName);
    let dataDict = readDataFromCsv(data, dataColArr, stateName, nationalName);
    drawLineChart(lineChartIdName, dataDict, dataColArr, stateName);
}

function mainLine() {
    let crime_type = document.currentScript.getAttribute('crime_type');
    let fileName = "data/state_crime.csv";
    let dataColArr = null;

    if (crime_type == "Violent"){
        dataColArr = [
            "Rates.Violent.Assault",
            "Rates.Violent.Murder",
            "Rates.Violent.Rape",
            "Rates.Violent.Robbery"
        ];
    }else{
        dataColArr = [
            "Rates.Property.Burglary",
            "Rates.Property.Larceny",
            "Rates.Property.Motor",
        ];
    }

    let nationalName = "United States";
    let lineChartIdName = "containerLine";

    d3.csv(fileName, function(error, data) {
        if (error) throw error;
        let dataDict = readDataFromCsv(data, dataColArr, nationalName, nationalName);

        anychart.onDocumentLoad(function() {
            drawLineChart(lineChartIdName, dataDict, dataColArr, nationalName);

            $('#svg_map path').on('click', function(){
              updateLineChart(lineChartIdName, data, dataColArr, nationalName, $(this));
            });
        });
    });
}

mainLine();
