var d3bb = (function(app, $, _, Backbone, d3) {
  return app;
}({}, jQuery, _, Backbone, d3));
var d3bb = (function(app, $, _, Backbone, d3) {
  app.ChartBaseView = Backbone.View.extend({
    defaults: {
      margin: {left: 50, right: 70, bottom: 30, top: 20},
      xAttr: 'x',
      yAttr: 'y',
      chartContainer: "#chart",
      templateText: {}
    },

    constructor: function(options) {
      Backbone.View.prototype.constructor.apply(this, arguments);
      this.listenTo(this, 'show', this.afterRender);
      this.listenTo(this.collection, 'add', this.updateChart);
      this.listenTo(this.collection, 'remove', this.updateChart);
      this.listenTo(this.collection, 'reset', this.updateChart);
    },

    initialize: function(options) {
      this.config = _.extend( {}, this.defaults, options );
    },

    events : {
      "load": "appendChart"
    },

    serializeData: function() {},
    getXScale:  function() {},
    getYScale:  function() {},
    renderAxes: function() {},
    renderData: function() {},
    updateChart: function () {},

    getScales : function() {
      this.scales = {
        x: this.getXScale(),
        y: this.getYScale()
      };
    },

    render: function() {
      var template = _.template( $(this.config.template).html() );
      this.$el.append(template( this.config.templateText ));

      if (this.onRender) {
        this.onRender();
      }

      this.trigger("show");
      return this;
    },

    afterRender: function() {
      var margin = this.config.margin;

      this.width = this.$el.width() - margin.left - margin.right;
      this.height = this.$el.height() - margin.top - margin.bottom;

      this.svg = d3.select(this.config.chartContainer).append("svg")
          .attr("width", this.width + margin.left + margin.right)
          .attr("height", this.height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      this.getScales();
      this.renderAxes();
      this.renderChart();
    }
  });
  return app;
}(d3bb, jQuery, _, Backbone, d3));

var d3bb = (function(app, $, _, Backbone, d3) {
  app.ChartBarView = app.ChartBaseView.extend({

    defaults: _.defaults({
      barPadding: 0.1
    }, app.ChartBaseView.prototype.defaults),

    initialize: function(options) {
      this.config = _.extend( {}, this.defaults, options );
    },

    getXScale: function() {
      var padding = this.config.barPadding;
      return d3.scale.ordinal()
        .rangeRoundBands([0, this.width], padding)
        .domain(this.collection.pluck(this.config.xAttr));
    },

    getYScale: function() {
      return d3.scale.linear()
        .rangeRound([this.height, 0])
        .domain([0, d3.max(this.collection.pluck(this.config.yAttr))]);
    },

    renderAxes: function() {
      this.xAxis = d3.svg.axis()
        .scale(this.scales.x)
        .orient("bottom");

      this.yAxis = d3.svg.axis()
        .scale(this.scales.y)
        .orient("left");

      this.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height + ")")
        .call(this.xAxis);

      this.svg.append("g")
        .attr("class", "y axis")
        .call(this.yAxis);
    },

    renderChart: function() {
      var chart = this,
          xScale = this.scales.x,
          yScale = this.scales.y;

      this.svg.selectAll(".bar")
          .data(this.collection.toJSON())
        .enter().append("rect")
          .attr("class", "bar")
          .attr("id", function(d) { return "bar-" + d[chart.config.xAttr]; })
          .attr("data-x", function(d) { return d[chart.config.xAttr]; })
          .attr("data-y", function(d) { return d[chart.config.yAttr]; })
          .attr("x", function(d) { return xScale(d[chart.config.xAttr]); })
          .attr("y", function(d) { return yScale(d[chart.config.yAttr]); })
          .attr("width", xScale.rangeBand())
          .attr("height", function(d) { return chart.height - yScale(d[chart.config.yAttr]); });
    },

    updateChart: function() {
      var chart = this,
          xScale = this.scales.x,
          yScale = this.scales.y,
          data = this.collection.toJSON();

      xScale.domain(chart.collection.pluck(chart.config.xAttr));
      yScale.domain([0, d3.max(chart.collection.pluck(chart.config.yAttr))]).nice();

      var bars = this.svg.selectAll(".bar").data(data);
      bars.exit().remove();
      bars.enter().append("rect")
        .attr("class", "bar")
        .attr("id",     function(d) { return "bar-" + d[chart.config.xAttr]; })
        .attr("data-x", function(d) { return d[chart.config.xAttr]; })
        .attr("data-y", function(d) { return d[chart.config.yAttr]; });

      chart.svg.select(".x.axis").transition().duration(1000).call(chart.xAxis);
      chart.svg.select(".y.axis").transition().duration(1000).call(chart.yAxis);
      bars.transition().duration(1000)
        .attr("x", function(d) { return xScale(d[chart.config.xAttr]); })
        .attr("y", function(d) { return yScale(d[chart.config.yAttr]); })
        .attr("width", xScale.rangeBand())
        .attr("height", function(d) { return chart.height - yScale(d[chart.config.yAttr]); });
    }
  });

  return app;
}(d3bb, jQuery, _, Backbone, d3));


var d3bb = (function(app, $, _, Backbone, d3) {
  app.ChartLineView = app.ChartBaseView.extend({
    defaults: _.defaults({
      yAttr: ["y"],
      addPoints: true,
      pointR: 4,
      colors: d3.scale.category10()
    }, app.ChartBaseView.prototype.defaults),

    initialize: function(options) {
      this.config = _.extend( {}, this.defaults, options );

      // make sure the y-axis variables are in an array, even
      // if there is only one
      if (! Array.isArray(this.config.yAttr)) {
        this.config.yAttr = [this.config.yAttr];
      }
    },

    getXScale: function() {
      var chart = this;
      return d3.scale.linear()
        .range([0, this.width])
        .domain(d3.extent(chart.collection.toJSON(), function(d) { return d[chart.config.xAttr]; }))
        .nice();
    },

    getYScale: function() {
      var chart = this,
          data = this.config.collection.toJSON(),
          yNames = this.config.yAttr,
          yMax = 0;

      _.each(yNames, function(yName) {
        var max = _.max(data, function(d) { return d[yName]; })[yName];
        yMax = yMax < max ? max : yMax;
      });

      return d3.scale.linear()
        .range([chart.height, 0])
        .domain([0,yMax])
        .nice();
    },

    renderAxes: function() {
      this.xAxis = d3.svg.axis()
        .scale(this.scales.x)
        .orient("bottom");

      this.yAxis = d3.svg.axis()
        .scale(this.scales.y)
        .orient("left");

      this.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height + ")")
        .call(this.xAxis);

      this.svg.append("g")
        .attr("class", "y axis")
        .call(this.yAxis);
    },

    renderChart: function() {
      var chart = this,
          xScale = this.scales.x,
          yScale = this.scales.y,
          x = this.config.xAttr,
          yNames = this.config.yAttr;

      var data = this.collection.toJSON();

      ///
      chart.lines = {};
      _.each(yNames, function(y, i) {
        chart.lines[y] = d3.svg.line()
          .x(function(d) { return xScale(d[x]); })
          .y(function(d) { return yScale(d[y]); });

        chart.svg.append("svg:path")
          .attr("class", "line line-" + y)
          .attr("id", "line-" + y)
          .attr("stroke", chart.config.colors(i))
          .attr("d", chart.lines[y](data));

        if (chart.config.addPoints) {
          chart.svg.selectAll(".point-" + y)
            .data(data)
            .enter().append("circle")
              .attr("class", "point point-" + y)
              .attr("id", function(d,i) { return "line-" + y + "-point-" + i; })
              .attr("data-x", function(d) { return d[x]; })
              .attr("data-y", function(d) { return d[y]; })
              .attr("fill", chart.config.colors(i))
              .attr("cx", function(d) { return xScale(d[x]); })
              .attr("cy", function(d) { return yScale(d[y]); })
              .attr("r", chart.config.pointR);
        }
      });
      ///
    },

    updateChart: function() {
      var chart = this,
          xScale = this.scales.x,
          yScale = this.scales.y,
          x = this.config.xAttr,
          yNames = this.config.yAttr,
          yMax = 0;

      var data = chart.collection.toJSON();

      _.each(yNames, function(yName) {
        var max = _.max(data, function(d) { return d[yName]; })[yName];
        yMax = yMax < max ? max : yMax;
      });

      xScale.domain(d3.extent(data, function(d) { return d[chart.config.xAttr]; })).nice();
      yScale.domain([0,yMax]).nice();

      chart.svg.select(".x.axis").transition().duration(1000).call(chart.xAxis);
      chart.svg.select(".y.axis").transition().duration(1000).call(chart.yAxis);

      ///
      _.each(yNames, function(y) {
        chart.svg.select(".line-" + y).transition().duration(1000)
          .attr("class", "line")
          .attr("d", chart.lines[y](data));

        if (chart.config.addPoints) {

          var points = chart.svg.selectAll(".point-" + y).data(data);
          points.exit().remove();
          points.enter().append("circle")
            .attr("class", "point")
            .attr("id", function(d,i) { return "line-" + y + "-point-" + i; })
            .attr("data-x", function(d) { return d[x]; })
            .attr("data-y", function(d) { return d[y]; });

          points.transition().duration(1000)
            .attr("cx", function(d) { return xScale(d[x]); })
            .attr("cy", function(d) { return yScale(d[y]); })
            .attr("r", chart.config.pointR);
        }
      });
    }
  });
  return app;
}(d3bb, jQuery, _, Backbone, d3));


var d3bb = (function(app, $, _, Backbone, d3) {
  app.ChartPieView = app.ChartBaseView.extend({
    defaults: _.defaults({
      labels: "labels",
      colors: d3.scale.category20(),
      innerRadius: 0
    }, app.ChartBaseView.prototype.defaults),

    initialize: function(options) {
      this.config = _.extend( {}, this.defaults, options );
    },

    renderChart: function() {
      var chart = this,
          color = this.config.colors,
          outerRadius = Math.min(this.height, this.width) / 2,
          innerRadius = this.config.innerRadius;

      chart.arc = d3.svg.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

      chart.pie = d3.layout.pie()
        .value(function(d) { return d[chart.config.yAttr]; })
        .sort(function(d) { return d[chart.config.labels]; });

      var arcs = chart.svg.selectAll("g.arc")
        .data(chart.pie( chart.collection.toJSON() )).enter().append("g")
          .attr("class", "arc")
          .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")");

      arcs.append("path")
        .attr("fill", function(d,i) { return color(i); })
        .attr("d", chart.arc)
        .each(function(d) { this._current = d; });

      arcs.append("text")
        .attr("transform", function(d) { return "translate(" + chart.arc.centroid(d) + ")"; })
        .attr("text-anchor", "middle")
        .text(function(d) { return d.value; })
          .attr("class", "data-label");
    },

    updateChart: function() {
      var chart = this,
          color = this.config.colors,
          outerRadius = this.height / 2;

      var arcs = chart.svg.selectAll("g.arc").data(chart.pie( chart.collection.toJSON() ));

      arcs.exit().remove();
      arcs.enter().append("g")
          .attr("class", "arc")
          .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")");
      arcs.append("path")
        .transition().duration(1000)
        .attr("fill", function(d,i) { return color(i); })
        .attr("d", chart.arc);

      arcs.append("text")
        .attr("transform", function(d) { return "translate(" + chart.arc.centroid(d) + ")"; })
        .attr("text-anchor", "middle")
        .text(function(d) { return d.value; })
          .attr("class", "data-label");
    }
  });
  return app;
}(d3bb, jQuery, _, Backbone, d3));

var d3bb = (function(app, $, _, Backbone, d3) {
  app.ChartScatterplotView = app.ChartBaseView.extend({
    defaults: _.defaults({
      r: 3
    }, app.ChartBaseView.prototype.defaults),

    initialize: function(options) {
      this.config = _.extend( {}, this.defaults, options );
    },

    getXScale: function() {
      return d3.scale.linear()
        .rangeRound([0, this.width])
        .domain([0, d3.max(this.collection.pluck(this.config.xAttr))])
        .nice();
    },

    getYScale: function() {
      return d3.scale.linear()
        .rangeRound([this.height, 0])
        .domain([0, d3.max(this.collection.pluck(this.config.yAttr))])
        .nice();
    },

    renderAxes: function() {
      this.xAxis = d3.svg.axis()
        .scale(this.scales.x)
        .orient("bottom");

      this.yAxis = d3.svg.axis()
        .scale(this.scales.y)
        .orient("left");

      this.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height + ")")
        .call(this.xAxis);

      this.svg.append("g")
        .attr("class", "y axis")
        .call(this.yAxis);
    },

    renderChart: function() {
      var chart  = this,
          xScale = this.scales.x,
          yScale = this.scales.y;

      this.svg.selectAll(".point")
        .data(this.collection.toJSON())
        .enter().append("circle")
          .attr("class", "point")
          .attr("data-x", function(d) { return d[chart.config.xAttr]; })
          .attr("data-y", function(d) { return d[chart.config.yAttr]; })
          .attr("cx", function(d) { return xScale(d[chart.config.xAttr]); })
          .attr("cy", function(d) { return yScale(d[chart.config.yAttr]); })
          .attr("r", chart.config.r);
    },

    updateChart: function() {
      var chart  = this,
          xScale = this.scales.x,
          yScale = this.scales.y,
          data   = this.collection.toJSON();

      xScale.domain([0, d3.max(this.collection.pluck(this.config.xAttr))]).nice();
      yScale.domain([0, d3.max(this.collection.pluck(this.config.yAttr))]).nice();

      chart.svg.select(".x.axis").transition().duration(1000).call(chart.xAxis);
      chart.svg.select(".y.axis").transition().duration(1000).call(chart.yAxis);

      var points = this.svg.selectAll(".point").data(data);
      points.exit().remove();
      points.enter().append("circle")
        .attr("class", "point")
        .attr("data-x", function(d) { return d[chart.config.xAttr]; })
        .attr("data-y", function(d) { return d[chart.config.yAttr]; });

      points.transition().duration(1000)
        .attr("cx", function(d) { return xScale(d[chart.config.xAttr]); })
        .attr("cy", function(d) { return yScale(d[chart.config.yAttr]); })
        .attr("r", chart.config.r);
    }
  });
  return app;
}(d3bb, jQuery, _, Backbone, d3));

var d3bb = (function(app, $, _, Backbone, d3) {
  app.ChartVbarView = app.ChartBaseView.extend({
    default: _.defaults({
      barPadding: 0.1
    }, app.ChartBaseView.prototype.defaults),

    initialize: function(options) {
      this.config = _.extend( {}, this.defaults, options );
    },

    getXScale: function() {
      return d3.scale.linear()
        .rangeRound([0, this.width])
        .domain([0, d3.max(this.collection.pluck(this.config.xAttr))]);
    },

    getYScale: function() {
      var padding = this.config.barPadding;
      return d3.scale.ordinal()
        .rangeRoundBands([0, this.height], padding)
        .domain(this.collection.pluck(this.config.yAttr));
    },

    renderAxes: function() {
      this.xAxis = d3.svg.axis()
        .scale(this.scales.x)
        .orient("bottom");

      this.yAxis = d3.svg.axis()
        .scale(this.scales.y)
        .orient("left");

      this.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height + ")")
        .call(this.xAxis);

      this.svg.append("g")
        .attr("class", "y axis")
        .call(this.yAxis);
    },

    updateChart: function() {
      var chart = this,
          xScale = this.scales.x,
          yScale = this.scales.y,
          data = this.collection.toJSON();

      xScale.domain([0, d3.max(chart.collection.pluck(chart.config.xAttr))]).nice();
      yScale.domain(chart.collection.pluck(chart.config.yAttr));

      var bars = this.svg.selectAll(".bar").data(data);
      bars.exit().remove();
      bars.enter().append("rect")
        .attr("class", "bar")
        .attr("id",     function(d) { return "bar-" + d[chart.config.xAttr]; })
        .attr("data-x", function(d) { return d[chart.config.xAttr]; })
        .attr("data-y", function(d) { return d[chart.config.yAttr]; });

      chart.svg.select(".x.axis").transition().duration(1000).call(chart.xAxis);
      chart.svg.select(".y.axis").transition().duration(1000).call(chart.yAxis);
      bars.transition().duration(1000)
        .attr("x", 0)
        .attr("y", function(d) { return yScale(d[chart.config.yAttr]); })
        .attr("height", yScale.rangeBand())
        .attr("width", function(d) { return xScale(d[chart.config.xAttr]); });
    },

    renderChart: function() {
      var chart = this,
          xScale = this.scales.x,
          yScale = this.scales.y;

      this.svg.selectAll(".bar")
          .data(this.collection.toJSON())
        .enter().append("rect")
          .attr("class", "bar");
          // .attr("id", function(d) { return "bar-" + d[chart.config.xAttr]; })
          // .attr("data-x", function(d) { return d[chart.config.xAttr]; })
          // .attr("data-y", function(d) { return d[chart.config.yAttr]; })
          // .attr("x", 0)
          // .attr("y", function(d) { return yScale(d[chart.config.yAttr]); })
          // .attr("height", yScale.rangeBand())
          // .attr("width", function(d) { return xScale(d[chart.config.xAttr]); });
      this.updateChart()
    }
  });

  return app;
}(d3bb, jQuery, _, Backbone, d3));
