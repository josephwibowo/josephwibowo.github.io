

var q = d3.queue();
q.defer(d3.csv, "https://josephwibowo.github.io/data/data.csv")
// q.defer(d3.json, "/words");
q.await(makeGraphs);
dc.config.defaultColors("schemeCategory10")


function reduceAddAvg(attr) {
  return function(p,v) {
      ++p.count
      p.link = v.link
      p.group = v.group_name
      p.sums += v[attr];
      p.averages = (p.count === 0) ? 0 : p.sums/p.count; // gaurd against dividing by zero
    return p;
  };
}
function reduceRemoveAvg(attr) {
  return function(p,v) {
      --p.count
      p.sums -= v[attr];
      p.averages = (p.count === 0) ? 0 : p.sums/p.count;
    return p;
  };
}
function reduceInitAvg() {
  return {count:0, sums:0, averages:0};
}

function makeGraphs(error, recordsJson, wordsJson) {
    // //wordcloud
    // var word_counts = {};
    // wordsJson.forEach(function(word) {
    //     word_counts[word] = word_counts.hasOwnProperty(word) ? word_counts[word] + 1 : 1;
    // });
    // keysSorted = Object.keys(word_counts).sort(function(a,b){return word_counts[b]-word_counts[a]}).slice(0,50);
    // var top_50_counts = {};
    // keysSorted.forEach(function(word) {
    //     top_50_counts[word] = word_counts[word];
    // });
    // word_entries = d3.entries(top_50_counts)
    // var svg_location = "#wordcloud";
    // var width = 600;
    // var height = 400;
    // var fill = d3.scaleOrdinal(d3.schemeCategory20);
    // var xScale = d3.scaleLinear()
    //        .domain([0, d3.max(word_entries, function(d) {
    //           return d.value;
    //         })
    //        ])
    //        .range([10,100]);
    // d3.layout.cloud().size([width, height])
    //       .timeInterval(20)
    //       .words(word_entries)
    //       .fontSize(function(d) { return xScale(+d.value); })
    //       .text(function(d) { return d.key; })
    //       .rotate(function() { return ~~(Math.random() * 2) * 90; })
    //       .font("Impact")
    //       .on("end", draw)
    //       .start();
    // function draw(words) {
    //       d3.select(svg_location).append("svg")
    //           .attr("width", width)
    //           .attr("height", height)
    //         .append("g")
    //           .attr("transform", "translate(" + [width >> 1, height >> 1] + ")")
    //         .selectAll("text")
    //           .data(words)
    //         .enter().append("text")
    //           .style("font-size", function(d) { return xScale(d.value) + "px"; })
    //           .style("font-family", "Impact")
    //           .style("fill", function(d, i) { return fill(i); })
    //           .attr("text-anchor", "middle")
    //           .attr("transform", function(d) {
    //             return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
    //           })
    //           .text(function(d) { return d.key; });
    //     }
    // d3.layout.cloud().stop();

    //GRAPHS
    var date = new Date()
    var dateFormat = d3.timeFormat("%Y-%m-%d %H:%M:%S");
    var dateFormatParser = d3.timeParse("%Y-%m-%d %H:%M:%S");

    //DATA RECORDS
    var records = recordsJson;
    records.forEach(function(d) {
        d["event_datetime"] = dateFormatParser(d["event_datetime"]);
        d["event_datetime"].setMinutes(0);
        d["event_datetime"].setSeconds(0);
        d["yes_rsvp_count"] = +d["yes_rsvp_count"]
        d["longitude"] = +d["lon"];
        d["latitude"] = +d["lat"];
    });
    var ndx = crossfilter(records);

    //DIMENSIONS
    var allDim = ndx.dimension(function(d) {return d;});
//    var groupDim = ndx.dimension(function(d) { return d["group_name"]; });
    var groupDim = ndx.dimension(function(d) { return d["group_name"] });

    //GROUPS
    var groupGroup = groupDim.group();
    var rsvpByGroup = groupDim.group()
                          .reduce(reduceAddAvg('yes_rsvp_count'), reduceRemoveAvg('yes_rsvp_count'), reduceInitAvg);

    // CHARTS
    // Most events per group
    var groupChart = dc.rowChart("#group-bar-chart");
    groupChart
        .width(350)
        .height(600)
        .dimension(groupDim)
        .group(groupGroup)
        .data(function (d) {
            return d.top(10);
        })
        .ordering(function(d) { return -d.value })
        .colors(['#6baed6'])
        .elasticX(true)
        .xAxis().ticks(4);

    // Manual attendance coutn
    function reduceAdd(p, v) {
        ++p.event_count
        p.rsvps += v['yes_rsvp_count'];
        p.avg_rsvp = (p.event_count === 0) ? 0 : p.rsvps/p.event_count;
        p.attn_count += (v['attendance_count'] === 0) ? null: v['attendance_count']
        p.rsvp_count += (v['attendance_count'] === 0) ? null: v['yes_rsvp_count']
        p.attendance_rate = p.attn_count / p.rsvp_count
        return p
    }
    function reduceRemove(p, v) {
        --p.event_count
        p.rsvps -= v['yes_rsvp_count'];
        p.avg_rsvp = (p.event_count === 0) ? 0 : p.rsvps/p.event_count;
        p.attn_count -= (v['attendance_count'] === 0) ? null: v['attendance_count']
        p.rsvp_count -= (v['attendance_count'] === 0) ? null: v['yes_rsvp_count']
        p.attendance_rate = p.attn_count / p.rsvp_count
        return p;
    }
    function reduceInitial() {
        return {
            event_count: 0,
            attn_count: 0,
            rsvp_count: 0,
            avg_rsvp: 0,
            attendance_rate: 0,
            rsvps: 0
        };
    }
    var grpGroup = groupDim.group().reduce(reduceAdd, reduceRemove, reduceInitial)
    function filter_sort_cap_bins(source_group) {
      return {
        all:function () {
          return source_group
            .all()
            .filter(d => !isNaN(d.value.attendance_rate))
            .sort((a,b) => b.value.attendance_rate - a.value.attendance_rate)
            .slice(0, 10);
        }
      };
    }
    var fakeGroup = filter_sort_cap_bins(grpGroup);
    var test = dc.barChart('#asdf')
                 .width(600)
                 .height(350)
                 .x(d3.scaleBand())
                 .xUnits(dc.units.ordinal)
                 .dimension(groupDim)
                 .group(fakeGroup)
                 .ordering(function(d) { return -d.attendance_rate; })
                 .valueAccessor(function (d) {
                    return d.value.attendance_rate;
                })
//    var moveChart = dc.compositeChart("#group-chart");
//    moveChart.width(600)
//            .height(300)
//            .transitionDuration(1000)
//            .margins({top: 30, right: 50, bottom: 25, left: 60})
//            .dimension(groupDim)
////            .mouseZoomable(true)
//            .shareTitle(false)
//            .elasticY(true)
//            .renderHorizontalGridLines(true)
//            .legend(dc.legend().x(70).y(10).itemHeight(13).gap(5))
//            .brushOn(false)
//            .compose([
//                dc.lineChart(moveChart)
//                        .group(eventGroup, "Event Count")
//                        .valueAccessor(function (d) {
//                            return d.value.event_count;
//                        }),
//                dc.lineChart(moveChart)
//                        .group(eventGroup, "Attendance Rate")
//                        .valueAccessor(function (d) {
//                            return d.value.attendance_rate;
//                        })
////                        .title(function (d) {
////                            var value = d.value.avg ? d.value.avg : d.value;
////                            if (isNaN(value)) value = 0;
////                            return dateFormat(d.key) + "\n" + numberFormat(value);
////                        })
//                        .ordinalColors(["orange"])
//                        .useRightYAxis(true)
//            ])
//            .yAxisLabel("Monthly Index Average")
//            .rightYAxisLabel("Monthly Index Move")
//            .renderHorizontalGridLines(true);

    var groupTable = dc_datatables.datatable('.dc-data-table');
    groupTable
        .dimension(rsvpByGroup)
        // Data table does not use crossfilter group but rather a closure
        // as a grouping function
        .group(function (d) {
            return "asdf";
        })
        .size(10)
        .columns([
            {
                label: 'group',
                format: function(d) {
                    return "<a target='_' href=" + d.value.link + ">" + d.value.group + "</a>";
                }
            },
            {
                label: 'rsvps',
                format: function(d) {
                    return d.value.sums;
                }
            },
            {
                label: 'avg',
                format: function(d) {
                    return d.value.averages;
                }
            }
        ])
        .order(d3.descending)
        // (_optional_) custom renderlet to post-process chart using [D3](http://d3js.org)
        .on('renderlet', function (table) {
            table.selectAll('.dc-data-table').classed('info', true);
        });
    // Most attended per group
//    var rsvpChart = dc.rowChart("#rsvp-bar-chart");
//    rsvpChart
//        .width(350)
//        .height(600)
//        .dimension(groupDim)
//        .group(rsvpByGroup)
//        .data(function (d) {
//            return d.top(10);
//        })
//        .ordering(function(d) { return -d.value.averages })
//        .valueAccessor(function (p) {
//            return p.value.averages;
//        })
//        .colors(['#6baed6'])
//        .elasticX(true)
//        .xAxis().ticks(4);
    // Time
    var dateDim = ndx.dimension(function(d) { return d["event_datetime"]; });
    var dayGroup = dateDim.group();
    var timeChart = dc.barChart("#time-chart");
    var timeRangeChart = dc.barChart("#time-range-chart");
    timeChart
        .width(680)
        .height(240)
        .margins({top: 10, right: 50, bottom: 20, left: 20})
        .dimension(dateDim)
        .brushOn(false)
        .group(dayGroup)
        .transitionDuration(500)
        .rangeChart(timeRangeChart)
        .x(d3.scaleTime().domain([new Date(date.getFullYear(), 0, 1), date]))
        .elasticY(true)
        .yAxis().ticks(4);
    // Time Range
    timeRangeChart.width(680)
        .height(40)
        .margins({top: 0, right: 50, bottom: 20, left: 40})
        .dimension(dateDim)
        .brushOn(true)
        .group(dayGroup)
        .x(d3.scaleTime().domain([new Date(2008, 0, 1), date]));
    //MAP

    var map = L.map('map');
    var drawMap = function(){

        map.setView([37.4763, -122.191], 9);
        mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';
        L.tileLayer(
            'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; ' + mapLink + ' Contributors',
                maxZoom: 15,
            }).addTo(map);

        //HeatMap
        var geoData = [];
        _.each(allDim.top(Infinity), function (d) {
            geoData.push([d["latitude"], d["longitude"], 1]);
        });
        var heat = L.heatLayer(geoData,{
            radius: 10,
            blur: 20,
            maxZoom: 1,
        }).addTo(map);

    };


    // FILTER
    dcCharts = [groupChart, timeChart, test];
    _.each(dcCharts, function (dcChart) {
        dcChart.on("filtered", function (chart, filter) {
            map.eachLayer(function (layer) {
                map.removeLayer(layer)
            });
        drawMap();
        });
    });

    // RENDER ALL CHARTS
    drawMap();
    dc.renderAll();
    groupTable.dt().order([ 1, 'desc' ]).draw()


    // ON CHANGE
//    d3.select('#startYear').on('change', function() {
//        startYear = this.value;
//        minDate = new Date(this.value, 0, 1, 0, 0, 0);
//        maxDate = new Date(endYear, 11, 31, 23, 59, 59);
//        timeChart.x(d3.scaleTime().domain([minDate, maxDate]))
//        dc.redrawAll();
//    });
//    d3.select('#endYear').on('change', function() {
//        endYear = this.value;
//        minDate = new Date(startYear, 0, 1, 0, 0, 0);
//        maxDate = new Date(this.value, 11, 31, 23, 59, 59);
//        timeChart.x(d3.scaleTime().domain([minDate, maxDate]))
//        timeChart.redrawGroup();
//    });
};