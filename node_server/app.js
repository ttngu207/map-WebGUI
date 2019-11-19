const express = require('express');
const config = require('./config')
const fs = require('fs');
const util = require('util');
const bodyParser = require('body-parser');
const request = require('request');
const http = require('http');
const path = require('path');
const jwt = require('jsonwebtoken');
const checkAuth = require('./middleware/check-auth');
// const serveStatic = require('serve-static')

const app = express();
app.use(bodyParser.json());


const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)
// const readImage = util.promisify(fs.createReadStream)

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    next();
})
// app.use(express.static(path.join(__dirname + '/test')));

// configure backend address
flask_backend = process.env['PY_BACKEND'] || 'http://localhost:5000'


// app.use([checkAuth, serveStatic('static/plotImg')])


// =============================== login logic ================================= //
app.post('/login', (req, res) => {
    if (req.body.username === config.demoUsername && req.body.password === config.demoPassword) {
        const token = jwt.sign({username: req.body.username},
                                config.jwtSecret,
                                { expiresIn: "24h"});
        res.status(200).send({ message: 'successful login', token: token, expiresIn: 24 * 60 * 60 * 1000}); //return in millisec
    } else {
        // res.status(401).send({message : 'failed login'})
        res.status(200).send({ message: 'failed login' }) // frontside doesn't seem to receive the message sent back in 401 status thus the 200 status here - TO REVISIT
    }
    
});

// ======================== getting info from flask server ========================== //
app.get('/sessions', checkAuth, (req, res) => {
    console.log('req.headers is', req.headers)
    // setup for proxy server
    var options = {
        // hostname: '127.0.0.1/',
        hostname: flask_backend.split(':')[1].split('//')[1],
        port: parseInt(flask_backend.split(':')[2]),
        path: 'v0/_q/sessionpage/?__order=session_date', //'v0/session',
        method: req.method,
        headers: req.headers
    };

    var proxy = http.request(options, function (proxy_res) {
        res.writeHead(proxy_res.statusCode, proxy_res.headers)
        proxy_res.pipe(res, {
            end: true
        });
    });

    // console.log(res)

    req.pipe(proxy, {
        end: true
    });
})

app.post('/sessions', checkAuth, (req, res) => {
    console.log('posting to filter session page');
    console.log('This is the guy!!!')
    console.log('requesting with - ', req.body)
    // request.post(flask_backend + '/v0/_q/sessionpage', { form: req.body }, function (error, httpResponse, body) {

    request.post(flask_backend + '/v0/_q/sessionpage', { form: req.body }, function (error, httpResponse, body) {
        if (error) {
            console.error('error: ', error);
            console.log('httpResponse:', httpResponse)
        }
        // console.log(body);
        res.send(body);
    })
})



app.get('/mice', checkAuth, (req, res) => {
    // setup for proxy server
    var options = {
        // hostname: '127.0.0.1/',
        hostname: flask_backend.split(':')[1].split('//')[1],
        port: parseInt(flask_backend.split(':')[2]),
        path: 'v0/_q/subjpage',//'v0/subject',
        method: req.method,
        headers: req.headers
    };

    var proxy = http.request(options, function (proxy_res) {
        res.writeHead(proxy_res.statusCode, proxy_res.headers)
        proxy_res.pipe(res, {
            end: true
        });
    });

    req.pipe(proxy, {
        end: true
    });
})

app.post('/mice', checkAuth, (req, res) => {
    // console.log('req.headers is', req.headers)
    // console.log(req.body);
    let sessionPath = 'v0/subject/?'
    let query = ''
    let count = 0
    // console.log('filter in filterValues are: ')
    for (filter in req.body) {
        console.log(filter, ": ", req.body[filter])
        if (count == 0) {
            query += filter + '=' + req.body[filter]
        } else {
            query += '&' + filter + '=' + req.body[filter]
        }
        count += 1;
    }
    //// setup for proxy server
    // console.log('body is: ', typeof req.body)
    var requestBody = JSON.stringify(req.body)

    // console.log('request body after stringify: ', typeof requestBody)
    // request.post('https://not-even-a-test.firebaseio.com/test3.json', { form: requestBody }, function (error, httpResponse, body) {
    //     if (error) {
    //         console.error('error: ', error);
    //     }
    //     console.log('response body is');
    //     console.log(body)
    // });
    request.post(flask_backend + '/v0/_q/subjpage', {form: req.body}, function(error, httpResponse, body) {
        if (error) {
            console.error('error: ', error);
        }

        res.send(body);
    })
})


app.post('/summary', checkAuth, (req, res) => {

    request.post(flask_backend + '/v0/_q/dailysummary', { form: req.body }, function (error, httpResponse, body) {
        if (error) {
            console.error('error: ', error);
        }
        // console.log(body);
        res.send(body);
    })
})

app.post('/plot/session-psych-plotData', checkAuth, (req, res) => {
    request.post(flask_backend + '/v0/sessionpsych', { form: req.body }, function (error, httpResponse, body) {
        if (error) {
            console.error('error: ', error);
        }
        res.send(body);
    })
})

app.post('/plot/session-RTC-plotData', checkAuth, (req, res) => {
    request.post(flask_backend + '/v0/sessionRTC', { form: req.body }, function (error, httpResponse, body) {

        if (error) {
            console.error('error: ', error);
        }
        res.send(body);
    })
})

app.post('/plot/session-RTTN-plotData', checkAuth, (req, res) => {
    request.post(flask_backend + '/v0/sessionRTTN', { form: req.body }, function (error, httpResponse, body) {
        if (error) {
            console.error('error: ', error);
        }
        res.send(body);
    })
})

app.post('/plot/waterWeightPlot', checkAuth, (req, res) => {
    request.post(flask_backend + '/v0/waterweight', { form: req.body }, function (error, httpResponse, body) {
        if (error) {
            console.error('error: ', error);
        }
        res.send(body);
    })
})

app.post('/plot/trialCountsSessionDurationPlot', checkAuth, (req, res) => {
    request.post(flask_backend + '/v0/TCsessionduration', { form: req.body }, function (error, httpResponse, body) {
        if (error) {
            console.error('error: ', error);
        }
        // let info = JSON.parse(body)
        res.send(body);
    })
})

app.post('/plot/performanceReactionTimePlot', checkAuth, (req, res) => {
    request.post(flask_backend + '/v0/performanceRT', { form: req.body }, function (error, httpResponse, body) {
        if (error) {
            console.error('error: ', error);
        }
        res.send(body);
    })
})

app.post('/plot/contrastHeatmapPlot', checkAuth, (req, res) => {
    request.post(flask_backend + '/v0/contrastheatmap', { form: req.body }, function (error, httpResponse, body) {
        if (error) {
            console.error('error: ', error);
        }
        res.send(body);
    })
})

app.post('/plot/fitParametersPlot', checkAuth, (req, res) => {
    request.post(flask_backend + '/v0/fitpars', { form: req.body }, function (error, httpResponse, body) {
        if (error) {
            console.error('error: ', error);
        }
        res.send(body);
    })
})

app.post('/plot/datePsychCurvePlot', checkAuth, (req, res) => {
    request.post(flask_backend + '/v0/datepsych', { form: req.body }, function (error, httpResponse, body) {
        if (error) {
            console.error('error: ', error);
        }
        res.send(body);
    })
})

app.post('/plot/dateReactionTimeContrastPlot', checkAuth, (req, res) => {
    request.post(flask_backend + '/v0/dateRTcontrast', { form: req.body }, function (error, httpResponse, body) {
        if (error) {
            console.error('error: ', error);
        }
        res.send(body);
    })
})

app.post('/plot/dateReactionTimeTrialNumberPlot', checkAuth, (req, res) => {
    request.post(flask_backend + '/v0/dateRTtrial', { form: req.body }, function (error, httpResponse, body) {
        if (error) {
            console.error('error: ', error);
        }
        res.send(body);
    })
})

app.post('/plot/cluster', checkAuth, (req, res) => {
    const timeX = new Date()
    console.log('requesting cluster list: ', timeX);
    request.post(flask_backend + '/v0/_q/clusternavplot', { form: req.body }, function (error, httpResponse, body) {
        if (error) {
            console.error('error: ', error);
        }
        const timeY = new Date()
        console.log('cluster list took ', timeY - timeX, ' ms')
        res.send(body);
    })
})

app.post('/plot/raster', checkAuth, (req, res) => {
    const timeA = new Date()
    console.log('requesting rasters to backend: ', timeA);
    request.post(flask_backend + '/v0/raster', { form: req.body }, function (error, httpResponse, body) {
        if (error) {
            console.error('error: ', error);
        }
        const timeB = new Date()
        console.log('rasters took ', timeB - timeA, ' ms to receive from backend')
        res.send(body);
    })
})

app.post('/plot/psth', checkAuth, (req, res) => {
    request.post(flask_backend + '/v0/psth', { form: req.body }, function (error, httpResponse, body) {
        if (error) {
            console.error('error: ', error);
        }
        res.send(body);
    })
})

app.post('/plot/rasterbatch', checkAuth, (req, res) => {
    // req.setTimeout(60000);
    const timeA = new Date()
    console.log('requesting rasters light batch to backend: ', timeA);
    request.post(flask_backend + '/v0/_q/rasterlight', { form: req.body, timeout: 180000 }, function (error, httpResponse, body) {
        if (error) {
            console.error('error: ', error);
        }
        const timeZ = new Date()
        console.log('rasters batch took ', timeZ - timeA, ' ms to receive from backend')
        console.log('=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- ')
        res.send(body);
    })
})

app.post('/plot/psthbatch', checkAuth, (req, res) => {
    // req.setTimeout(60000);
    const timeA = new Date()
    console.log('requesting psth batch to backend: ', timeA);
    request.post(flask_backend + '/v0/psthdata', { form: req.body, timeout: 200000 }, function (error, httpResponse, body) {
        if (error) {
            console.error('error: ', error);
        }
        const timeZ = new Date()
        console.log('psth data batch took ', timeZ - timeA, ' ms to receive from backend')
        console.log('=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- ')
        res.send(body);
    })
})
app.get('/plot/psthtemplate', checkAuth, (req, res) => {
    const time1 = new Date()
    request.get(flask_backend + '/v0/psthtemplate', function (error, httpResponse, body) {
        if (error) {
            console.error('error: ', error);
        }
        const time2 = new Date()
        console.log('psth template took ', time2 - time1, ' ms to receive from backend')
        res.send(body);
    })
})
app.get('/plot/rastertemplate', checkAuth, (req, res) => {
    const time1 = new Date()
    request.get(flask_backend + '/v0/rastertemplate', function(error, httpResponse, body) {
        if (error) {
            console.error('error: ', error);
        }
        const time2 = new Date()
        console.log('rasters templates took ', time2 - time1, ' ms to receive from backend')
        res.send(body);
    })
})


//Docker Healthcheck
app.get('/version', (req, res, next) => {
    res.send('Version: v1.0');    
});

// ============================================================= //


module.exports = app;
