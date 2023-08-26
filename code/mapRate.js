function dataPreprocessingMap(data, crime_type, yearStr) {
    let dataDict = {};
    let valueColName = "Rates.Property.All";
    if (crime_type == "Violent") {
        valueColName = "Rates.Violent.All";
    }
    let keyColName = "State";

    if (yearStr != "-1") {
        data = data.filter(d => d["Year"] == yearStr);
    }

    data.forEach(function(d) {
       let colName = "";
       if (d[keyColName] in dataDict){
           dataDict[d[keyColName]].push(parseFloat(d[valueColName]));
       }else{
           dataDict[d[keyColName]] = [parseFloat(d[valueColName])];
       }
    });

    let dataDictKeysArr = d3.keys(dataDict);

    for (let i = 0; i < dataDictKeysArr.length; i++) {
       let currKey = dataDictKeysArr[i];
       let currKeyData = dataDict[currKey];
       let sum = 0.0;

       for (let j = 0; j < currKeyData.length; j++) {
           sum += currKeyData[j];
       }

       let avg = sum / currKeyData.length;
       dataDict[currKey] = parseFloat(avg.toFixed(2));
    }
    return d3.entries(dataDict);
}


//Merge the ag. data and GeoJSON
//Loop through once for each ag. data value

function addValueToJson(dataInDict, json) {
    for (var i = 0; i < dataInDict.length; i++) {

        var dataState = dataInDict[i].key;
        var dataValue = dataInDict[i].value;

        //Find the corresponding state inside the GeoJSON
        for (var j = 0; j < json.features.length; j++) {

            var jsonState = json.features[j].properties.name;

            if (dataState == jsonState) {

                //Copy the data value into the JSON
                json.features[j].properties.value = dataValue;

                //Stop looking through the JSON
                break;

            }
        }
    }
    return json;
}


function mainMap() {
    //Width and height
    let crime_type = document.currentScript.getAttribute('crime_type');
    let defaultYear = document.currentScript.getAttribute('defaultYear');
    let allYears = "-1";
    let margin = {top: 20, right: 50, bottom: 0, left: 0};
    let w = $("#containerMap").width() - margin.left - margin.right;
    let h = $("#containerMap").height() - margin.top - margin.bottom;
    let fileName = "data/state_crime.csv";
    let colorOptions = ["#fef0d9","#fdcc8a","#fc8d59","#e34a33","#b30000"];
    // let colorOptions = ["rgb(237,248,233)","rgb(186,228,179)","rgb(116,196,118)","rgb(49,163,84)","rgb(0,109,44)"];
    let cityCircleSize = [5, 25];
    let plotTitleFontStyle = "22px sans-serif";
    let plotSubTitleFontStyle = "14px sans-serif";
    let legendFontStyle = "12px sans-serif";

    var projection = d3.geoAlbersUsa().translate([w/2, h/2]).scale([800]);

    //Define path generator, using the Albers USA projection
    var path = d3.geoPath()
                 // .projection(d3.geoAlbersUsa());
                 .projection(projection);

    var numColors = 9;

    //Define quantize scale to sort data values into buckets of color
    var color = d3.scaleQuantize()
                        // .range(colorOptions);
                        .range(colorbrewer.Reds[numColors]);
                        //Colors derived from ColorBrewer, by Cynthia Brewer, and included in
                        //https://github.com/d3/d3-scale-chromatic

    var circleScale = d3.scaleLinear().range(cityCircleSize);

    //Number formatting for population values
    var formatAsThousands = d3.format(",");  //e.g. converts 123456 to "123,456"

    //Create SVG element
    var svg = d3.select("#containerMap")
                .append("svg")
                .attr("width", w + margin.left + margin.right)
                // .attr("width", w)
                .attr("height", h + margin.top + margin.bottom)
                // .attr("height", h)
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .attr("id", "svg_map");

    //Load in data
    d3.csv(fileName, function(error, data) {
        if (error) throw error;
        let dataInDict = dataPreprocessingMap(data, crime_type, defaultYear);
        let dataInDictForAllYears = dataPreprocessingMap(data, crime_type, allYears);

        let minValData = d3.min(dataInDictForAllYears, function(d) { return d.value; });
        let maxValData = d3.max(dataInDictForAllYears, function(d) { return d.value; });

        //Set input domain for color scale
        color.domain([
            d3.min(dataInDictForAllYears, function(d) { return d.value; }),
            d3.max(dataInDictForAllYears, function(d) { return d.value; })
        ]);

        //Load in GeoJSON data
        d3.json("data/us-states.json", function(json) {

            json = addValueToJson(dataInDict, json);

            //Bind data and create one path per GeoJSON feature
            svg.selectAll("path")
               .data(json.features)
               .enter()
               .append("path")
               .attr("d", path)
               .attr("class", "pointer")
               .attr("id", function(d){
                   return "click_" + d.properties.name;
               })
               .style("fill", function(d) {
                    //Get data value
                    var value = d.properties.value;

                    if (value) {
                        //If value exists…
                        return color(value);
                    } else {
                        //If value is undefined…
                        return "#ccc";
                    }
               })
               .style("stroke", "#c5cbd3")
               .append("title")
               .text(function(d) {
                	return d.properties.name + ": " + formatAsThousands(d.properties.value);
               });

            // main title
            svg.append("text")
                .style("font", plotTitleFontStyle)
                .attr("text-anchor", "middle")
                .attr("transform", "translate("+ (w/4*3) +","+(margin.top + 10)+")")
                .text(crime_type);

        });
        // // Initial starting radius of the circle
        updateMap(defaultYear);

        d3.select("#slider").on("input", function() {
            updateMap(this.value);
        });

        // update the elements
        function updateMap(yearStr) {

            // adjust the text on the range slider
            $("#slider-value").text(+yearStr);
            d3.select("#slider").property("value", +yearStr);

            dataInDict = dataPreprocessingMap(data, crime_type, yearStr);

            //Load in GeoJSON data
            d3.json("data/us-states.json", function(json) {

                json = addValueToJson(dataInDict, json);

                //Bind data and create one path per GeoJSON feature
                svg.selectAll("path")
                    .data(json.features)
                    .transition()
                    .duration(300)
                    .style("fill", function(d) {
                        //Get data value
                        var value = d.properties.value;

                        if (value) {
                            //If value exists…
                            return color(value);
                        } else {
                            //If value is undefined…
                            return "#ccc";
                        }
                    })
                    .select("title")
                    .text(function(d) {
                    	return d.properties.name + ": " + formatAsThousands(d.properties.value);
                    })
            });
        }
        // end of update map

        // draw legend

        let legendVals = [];

        color.range().forEach(function(d){
        	legendVals.push(color.invertExtent(d));
        })

        let legend = svg.selectAll("g.legend")
        .data(legendVals)
        .enter().append("g")
        .attr("class", "legend");

        let ls_w = 20, ls_h = 20;

        legend.append("rect")
        .attr("x", w-35)
        .attr("y", function(d, i){ return h - (i*ls_h) - 2*ls_h;})
        .attr("width", ls_w)
        .attr("height", ls_h)
        .style("fill", function(d, i) {return color(parseFloat(d[0]+1).toFixed(0)); })
        .style("opacity", 0.8);

        legend.append("text")
        .style("font", legendFontStyle)
        .attr("x", w)
        .attr("y", function(d, i){ return h - (i*ls_h) - ls_h - 4;})
        .text(function(d, i){ return parseFloat(d[0]+1).toFixed(0) + "+"; });
    });
}

mainMap();
