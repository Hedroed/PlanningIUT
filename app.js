var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var webhooks = require('./routes/webhooks');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.png')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('node-sass-middleware')({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: true,
  sourceMap: true
}));
app.use(express.static(path.join(__dirname, 'public')));

//My middleware planning

var Calendar = require('./planning/room');
var targetRooms = ['B 126', 'B 141', 'B 024', 'B 029', 'B 003', 'B 005', 'B 022', 'B 028', 'B 035', 'B 037'];
var unusedRoom =  new Calendar("8241fc387320021490505f9a5167143de9c3bd72ae55c945119c94a4e4ca10a9c842f9f9f4c52cf70e3c7362addcee70af2e5271b7d9f5d6a78a7de7f43578e64ba18ba0fe71b19925c933d07c37de5a1cdad5504ad2f424f708bb109c51927eb2d39041b3001d5ef039ed4f30f5253bb1976c11f14fd6a0a77dd201c7828cbcb2f2bbdd1dc923bac6f9ea735524c7677125e8873a21e225a94ea143a514e97e67e2febb9c9cb242aa6ab1f86e04b0dbba8226c25382d19972dcdefa402bd824efe97f45a8df825fa1c65271eaf2718e661605276e58527baad35cf69655b32d5fe453874a0679870ce0d0f5caebef19aa6a9845b3c29ae6f72e8e81aeb572853b08ef95bccbd6d7424dd88d050b2b81bce5082ad6b9a1c4ada1f1f69ac0527e7b643e7ea0b0294d64ccfd53540caf4329e42a3586ec53810c6ef3e8612f5c2a5d342b193c7f5e30f2c161fd6762e2cec542a3ea88eddb0bfe1f96ba6f6089054f4ebf5ddfd49b43adf1a344df17bb8761918f339b17165c08c22ed36235b76067b3ce4c73d30e1b697da8f060b198750b7724b1752a8fd85d17721b71ea71690ef930d866402d097b1d901a8bfa631fd628db484a936744b93980939fd5edba693955dfb6006d1cc0b6ad440e66a0945c2198e6f9f5aa32646a9d5622ca8a3016f6dfa3d4c4dec746e84f7c9b78e263799f3e18454a68d7f9e7187a83de3688b2feb32c6fb898eca1d377f77fceb79b33135e66642c0dd1c49517ea8b2cbd3c32cc6302479afc71919bff1d45be9ae8e60515b6e78b2c9808fd79fda98b730694bb6243e276e3317980eb85acfaab89baf4b723d705849105948b9d2e01c48e2362962a37bcde48e3470b0abaf6152f4344026376f2d88a6a55e115128e38d4d6ac30895cb147fb9fd4ab68564015307f6337dad1d31583a2d30a798e161a5ff9373d5e13c78cb05d2619592881ee63ee8502e4e26de0b6627669509028e8430dbe363df4903d6deeda66081743739e32ab5ce751e5db85dc0c116b27188b7a2fd6390996e7e5cde5bcd93065741239d94f13c8024aff7aa923eb43d0c39eff1c7853a167934ca0bdfba825c0b489e150342cbf93b707a1504cdf3c1acef8543cfd5b81b930e6b64fdfbb1046e3de9bbcfeea78fed0a8b4", targetRooms);

var Planning = require('./planning');
var planInfo2 = new Planning("8241fc387320021460d62b880601db3b64f024f9f358aca3f8c622193b252c7c70ca02662d77329d659f71eb5a546079ab0d0ef21be75acf7c140d03600301e2f68b608172d7a40a23f88ba273aab1d0acd7b24671b1194634ae47158ec67a871331a2981729d29a504cdf3c1acef8543cfd5b81b930e6b64fdfbb1046e3de9bbcfeea78fed0a8b4");
var planInfo1 = new Planning("8241fc38732002147feaa7994a14fb1e46e84f7c9b78e263799f3e18454a68d7f9e7187a83de3688b2feb32c6fb898ec6388e00a65894b9fae26dd6b71b817bb50b37189fa0b8d2bddf02cf567b7259696298c15bc4f3e24");
//plan.updateLocal(true,'planning/planning.ics');

console.log("update");
planInfo2.updatePlanning();
planInfo1.updatePlanning();

setInterval(()=>{
    console.log("update planning");
    planInfo2.updatePlanning();
    planInfo1.updatePlanning();
},30 * 60000); // 30 minutes

setInterval(()=>{
    console.log("update room");
    Calendar.updateCalendar(unusedRoom);
},45 * 60000); // 45 minutes

app.use(function(req, res, next) {
    req.planInfo2 = planInfo2;
    req.planInfo1 = planInfo1;
    req.unusedRoom = unusedRoom;
    next();
});

app.use('/', index);
app.use('/webhooks', webhooks);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = {}//req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
