const createScheduler = require('probot-scheduler')


/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {

  // Your code here
  app.log('Yay, the app was loaded!')

  createScheduler(app, {
    interval: 24 * 60 * 60 * 1000 // 1 day
  })
  app.on('schedule.repository', context => {
    // this event is triggered on an interval, which is 1 hr by default
    console.log('schedule.repository was triggered')
    const params = context.repo()
    console.log('repo name: ' + params.repo)
  })

  app.on('issues.opened', async context => {
    console.log('a new issue was opened')
    const params = context.repo()
    console.log('repo name: ' + params.repo)

    const issueComment = context.issue({ body: 'Thanks for opening this issue!' })
    return context.github.issues.createComment(issueComment)
  })

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
