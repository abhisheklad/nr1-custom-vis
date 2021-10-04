import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import _ from 'lodash';
import { Card, CardBody, HeadingText, NrqlQuery, PlatformStateContext, Spinner, AutoSizer } from 'nr1';

export default class TimeseriesThresholdVisualization extends React.Component {

  static propTypes = {
    accountId: PropTypes.number,
    query: PropTypes.string,
    critical: PropTypes.string,
    warning: PropTypes.string,
    yAxis: PropTypes.string,
    MouseoverTooltip: PropTypes.string,
    chartType: PropTypes.bool
  };

  transformData = (result) => {
    var rawDataPoints = _.mapValues(result, 'data');
    var finalDataSet = [];
    _.map(rawDataPoints, function (k) {
      _.map(k, function (i) {
        var tmpArray = [];
        tmpArray.push(i.x, i.y);
        finalDataSet.push(tmpArray);
      });
    });
    return finalDataSet;
  };

  render() {

    const { accountId, query, warning, critical, yAxis, MouseoverTooltip, chartType } = this.props;
    if (!query) {
      return <EmptyState />;
    }

    return (
      <PlatformStateContext.Consumer>
        {({ timeRange }) => (
          <AutoSizer>
            {({ width, height }) => (
              <NrqlQuery
                query={query}
                accountId={parseInt(accountId)}
                timeRange={timeRange}
                pollInterval={NrqlQuery.AUTO_POLL_INTERVAL}
              >
                {({ data, loading, error }) => {
                  if (loading) {
                    return <Spinner />;
                  }

                  if (error) {
                    // Throwing an error displays an error state consistent with other
                    // visualizations.
                    throw new Error(error.message);
                  }

                  var transformedData = this.transformData(data);

                  Highcharts.setOptions({
                    global: {
                      useUTC: false
                    }
                  });

                  var options = {
                    chart: {
                      zoomType: 'x',
                      type: chartType ? 'area' : 'line'
                    },
                    legend: {
                      enabled: false
                    },
                    title: false,
                    xAxis: {
                      type: 'datetime'
                    },
                    yAxis: {
                      gridLineDashStyle: 'Dot',
                      gridLineWidth: '2',
                      min: 0,
                      title: {
                        text: yAxis
                      },
                      plotLines: [{
                        color: '#E54943',
                        width: 2,
                        dashStyle: 'shortdash',
                        value: parseFloat(critical)
                      }, {
                        color: '#F0D100',
                        width: 2,
                        dashStyle: 'shortdash',
                        value: parseFloat(warning)
                      }]
                    },
                    plotOptions: {
                      line: {
                        dataLabels: {
                          enabled: false
                        },
                        marker: {
                          enabled: false,
                          states: {
                            hover: {
                              enabled: false
                            }
                          }
                        }
                      }
                    },
                    series: [
                      {
                        name: MouseoverTooltip ? MouseoverTooltip : 'Value',
                        data: transformedData
                      }, {
                        name: MouseoverTooltip ? MouseoverTooltip : 'Value',
                        data: transformedData,
                        color: '#F0D100',
                        negativeColor: 'transparent',
                        threshold: parseFloat(warning)
                      }, {
                        //The CRITICAL threshold should come after in the array
                        name: MouseoverTooltip ? MouseoverTooltip : 'Value',
                        data: transformedData,
                        color: '#E54943',
                        negativeColor: 'transparent',
                        threshold: parseFloat(critical)
                      },]
                  };
                  return (
                    <HighchartsReact
                      highcharts={Highcharts}
                      options={options}
                    />
                  );
                }}
              </NrqlQuery>
            )}
          </AutoSizer>
        )}
      </PlatformStateContext.Consumer>
    );
  }
}

const EmptyState = () => (
  <Card className="EmptyState-Card">
    <CardBody className="EmptyState-Card-Body">
      <HeadingText
        spacingType={[HeadingText.SPACING_TYPE.LARGE]}
        type={HeadingText.TYPE.HEADING_3}
      >
        Please provide at least one NRQL query and account ID pair
      </HeadingText>
      <HeadingText
        spacingType={[HeadingText.SPACING_TYPE.MEDIUM]}
        type={HeadingText.TYPE.HEADING_4}
      >
        An example NRQL query you can try is:
      </HeadingText>
      <code>SELECT average(cpuPercent) FROM ProcessSample SINCE 1 DAY AGO TIMESERIES</code>
    </CardBody>
  </Card>
);