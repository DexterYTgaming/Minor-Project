$(document).ready(function(){
    var url = "https://data.covid19india.org/v4/min/timeseries.min.json"

    $.getJSON(url,function(data){
        console.log(data)

        var total_confirmed, total_recovered, total_tested, total_vaccinated1, total_vaccinated2
        var confirmed = []
        var recovered = []
        var tested = []
        var vaccinated1 = []
        var vaccinated2 = []
        console.log('data,data',data);
        $.each(data.AP.dates,function(id,obj){
            console.log('obj -- ',obj.confirmed);
            confirmed.push(obj.confirmed)
            recovered.push(obj.recovered)
            tested.push(obj.tested)
            vaccinated1.push(obj.vaccinated1)
            vaccinated2.push(obj.vaccinated2)
        })

        var myChart = document.getElementById("myChart").getContext('2d')
        console.log('confirmed',confirmed);
        var chart = new Chart(myChart,{
            type:'line',
            data:{
                datasets: [{
                    label:"confirmed cases",
                    data:confirmed,
                    backgroundColor:"#f1c40f",
                    minBarLength:100,
                },{
                    label:"recovered cases",
                    data:recovered,
                    backgroundColor:"#f1c40f",
                    minBarLength:100,
                },
            ]
            },
            options:{
                scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
            }
        })
    })
})