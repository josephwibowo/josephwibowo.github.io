

var q = d3.queue();
// q.defer(d3.csv, "http://127.0.0.1:4000/data/data.csv")
q.defer(d3.csv, "https://josephwibowo.github.io/data/data.csv")
q.await(makeGraphs);
dc.config.defaultColors("schemeCategory10")

var stopwords = ['the', 'and', 'in', 'for', 'at', 'to', 'on', 'a', 'an', 'of', 'with', 'by', 'its', 'can', 'be', 'it',
                 'too', 'are', 'day', 'as', 'my', 'your', 'how'];

function makeGraphs(error, records) {

    // Filter Functions for filtering out blank venue names
    function remove_empty_keys(source_group) {
        function not_blank(d) {
            return d.key !== "";
        }
        var bins = Array.prototype.slice.call(arguments, 1);
        return {
            all:function () {
                return source_group.all().filter(function(d) {
                    return bins.indexOf(d.key) !== "";
                });
            },
            top: function(n) {
                return source_group.top(Infinity)
                    .filter(not_blank)
                    .slice(0, n);
            }
        };
    }

    function isPositiveInteger(n) {
        return n >>> 0 === parseFloat(n);
    }

    function reduceAddAvg(attr) {
      return function(p,v) {
          ++p.count
          p.link = v.link
          p.group = v.group_name
          p.sums += v[attr];
          p.averages = (p.count === 0) ? 0 : p.sums/p.count; // guard against dividing by zero
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

    //GRAPHS
    var date = new Date()
    var dateFormat = d3.timeFormat("%Y-%m-%d %H:%M:%S");
    var dateFormatParser = d3.timeParse("%Y-%m-%d %H:%M:%S");

    //DATA RECORDS
    var records = records;
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
    var groupDim = ndx.dimension(function(d) { return d["group_name"] });
    var eventDim = ndx.dimension(function(d) { return d["event_name"] });
    var venueDim = ndx.dimension(function(d) { return d["name"] });

    //GROUPS
    var groupGroup = groupDim.group();
    var venueGroup = venueDim.group();
    venueGroup = remove_empty_keys(venueGroup);
    var eventGroup = eventDim.group().reduceSum(function (d) {
        return d.yes_rsvp_count;
    });
    var rsvpByGroup = groupDim.group()
        .reduce(reduceAddAvg('yes_rsvp_count'), reduceRemoveAvg('yes_rsvp_count'), reduceInitAvg);

    
    // ---------- ALL CHARTS --------------

    // Events over Time Chart
    var monthDim = ndx.dimension(function(d) { return d3.timeMonth(d["event_datetime"]); });
    var monthGroup = monthDim.group();
    var timeChart = dc.barChart("#time-chart");
    var timeRangeChart = dc.barChart("#time-range-chart");
    timeChart
        .width(550)
        .height(350)
        .margins({top: 10, right: 20, bottom: 25, left: 40})
        .dimension(monthDim)
        .brushOn(false)
        .centerBar(true)
        .gap(3)
        .group(monthGroup)
        .transitionDuration(500)
        .rangeChart(timeRangeChart)
        .xUnits(d3.timeMonths)
        .yAxisLabel("Count of Events")
        .x(d3.scaleTime().domain([new Date(2008, 0, 1), date]))
        .elasticY(true)
        .yAxis().ticks(3);
    timeRangeChart.width(560)
        .height(100)
        .margins({top: 0, right: 50, bottom: 20, left: 40})
        .dimension(monthDim)
        .brushOn(true)
        .group(monthGroup)
        .x(d3.scaleTime().domain([new Date(2008, 0, 1), date]))
        .elasticY(true)
        .yAxis().ticks(3);
   
    // Heatmap Chart
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
            radius: 7,
            blur: 13,
            maxZoom: 1,
        }).addTo(map);
    };

    // event tooltip
    var formatTime = d3.timeFormat("%Y-%B");
    var rowtip = d3.tip()
        .attr("class", "d3-tip")
        .offset([-8, 0])
        .html(function(d) { return formatTime(d.x) + ': ' + d.y; });
    timeChart.on('pretransition.add-tip', function(chart) {
    chart.selectAll('rect.bar')
        .call(rowtip)
        .on('mouseover', rowtip.show)
        .on('mouseout', rowtip.hide);
    });

    // Most events per group
    var groupChart = dc.rowChart("#group-bar-chart");
    groupChart
        .width(400)
        .height(400)
        .dimension(groupDim)
        .group(groupGroup)
        .data(function (d) {
            return d.top(10);
        })
        .ordering(function(d) { return -d.value })
        .colors(['#6baed6'])
        .elasticX(true)
        .xAxis().ticks(4);

    // Most RSVPs for Event
    var topeventsChart = dc.rowChart("#event-bar-chart");
    topeventsChart
        .width(400)
        .height(400)
        .dimension(eventDim)
        .group(eventGroup)
        .data(function (d) {
            return d.top(10);
        })
        .ordering(function(d) { return -d.value })
        .colors(['#6baed6'])
        .elasticX(true)
        .xAxis().ticks(6);

    // Most Events per Venue
    var topVenuesChart = dc.rowChart("#venue-bar-chart");
    topVenuesChart
        .width(400)
        .height(400)
        .dimension(venueDim)
        .group(venueGroup)
        .data(function (d) {
            return d.top(10);
        })
        .ordering(function(d) { return -d.value })
        .colors(['#6baed6'])
        .elasticX(true)
        .xAxis().ticks(6);

    // Word Cloud
    var svg_location = "#wordcloud";
    var width = 500;
    var height = 400;
    var svg = d3.select(svg_location)
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + [width >> 1, height >> 1] + ")");

    // Create words from event names from filtered dataset            
    var getWords = function() {
        names = [];
        words = [];
        _.each(allDim.top(Infinity), function (d) {
            names.push(d["event_name"]);
        });

        // Clean event names and split names into words
        names.forEach(function(name) {
            var n = name.toLowerCase();
            n = n.replace(/((?:^|\W)san)\s|((?:^|\W)de)\s|((?:^|\W)los)\s/, '$1$2$3_');
            n = n.replace(/[^0-9a-zA-Z\s_]+/, '');
            n = n.replace(/[0-9]+(pm|am|th)/, '').trim();
            n.split(' ').forEach(function(word) {
                if (!stopwords.includes(word) && word.length > 1 && !isPositiveInteger(word)) {
                    words.push(word)
                };
            });
        });

        // Generate counts for each word
        var word_counts = {};
        words.forEach(function(word) {
            word_counts[word] = word_counts.hasOwnProperty(word) ? word_counts[word] + 1 : 1;
        });
        keysSorted = Object.keys(word_counts).sort(function(a,b){return word_counts[b]-word_counts[a]}).slice(0,50);
        var top_50_counts = {};
        keysSorted.forEach(function(word) {
            top_50_counts[word] = word_counts[word];
        });
        word_entries = d3.entries(top_50_counts)

        return word_entries;
    }

    function updateWords() {
        var word_entries = getWords();
        var xScale = d3.scaleLinear()
            .domain([0, d3.max(word_entries, function(d) {
                return d.value;
            })])
            .range([10,100]);
        d3.layout.cloud().size([width, height])
            .timeInterval(20)
            .words(word_entries)
            .fontSize(function(d) { return xScale(+d.value); })
            .text(function(d) { return d.key; })
            .rotate(function() { return ~~(Math.random() * 2) * 90; })
            .font("Impact")
            .on("end", draw)
            .start();
    };

    function draw(words) {
        var fill = d3.scaleOrdinal(d3.schemeCategory20);
        var xScale = d3.scaleLinear()
                       .domain([0, d3.max(words, function(d) {
                            return d.value;
                        })])
                       .range([10,100]);
        svg.selectAll("*").remove(); // Remove all text elemtns
        var selectVis = svg.selectAll("text")
            .data(words);
        
        selectVis.enter().append("text")
            .style("font-size", function(d) { return xScale(d.value) + "px"; })
            .style("font-family", "Impact")
            .style("fill", function(d, i) { return fill(i); })
            .attr("text-anchor", "middle")
            .attr("transform", function(d) {
                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text(function(d) { return d.key; });
    };

    // DATA TABLES
    var groupTable = dc_datatables.datatable('#groups-data-table');
    groupTable
        .dimension(rsvpByGroup)
        // Data table does not use crossfilter group but rather a closure
        // as a grouping function. This is a dummy group to initialize it.
        .group(function (d) {
            return "";
        })
        .size(10)
        .columns([
            {
                label: 'Group Name',
                format: function(d) {
                    return "<a target='_' href=" + d.value.link + ">" + d.value.group + "</a>";
                }
            },
            {
                label: 'Total RSVPs',
                format: function(d) {
                    return d3.format(',')(d.value.sums);
                }
            },
            {
                label: 'Total Events',
                format: function(d) {
                    return d3.format(',')(d.value.count);
                }
            },
            {
                label: 'Average RSVPs/Event',
                format: function(d) {
                    return d3.format(',.2f')(d.value.averages);
                }
            }
        ])
        .order(d3.descending)
        .on('renderlet', function (table) {
            table.selectAll('#groups-data-table').classed('info', true);
        });


    // UPDATE MAP/WORDCLOUD ON FILTER
    dcCharts = [groupChart, timeChart, topeventsChart, topVenuesChart];
    _.each(dcCharts, function (dcChart) {
        dcChart.on("filtered", function (chart, filter) {
            map.eachLayer(function (layer) {
                map.removeLayer(layer)
            });
        drawMap();
        updateWords();
        });
    });

    // INIT/RENDER ALL CHARTS
    var word_entries = getWords();
    xScale = d3.scaleLinear()
        .domain([0, d3.max(word_entries, function(d) {
            return d.value;
        })])
        .range([10,100]);
    d3.layout.cloud().size([width, height])
        .timeInterval(20)
        .words(word_entries)
        .fontSize(function(d) { return xScale(+d.value); })
        .text(function(d) { return d.key; })
        .rotate(function() { return ~~(Math.random() * 2) * 90; })
        .font("Impact")
        .on("end", draw)
        .start();
    drawMap();
    dc.renderAll();
    groupTable.dt().order([ 1, 'desc' ]).draw()
};