import 'dotenv/config';
import {server} from './app.js';
import {env} from './lib/env.js';

function bootstrap() {
  server.listen(env.PORT, () => {
    console.log('Listening on http://localhost:%d', env.PORT);
  });
}
bootstrap();
