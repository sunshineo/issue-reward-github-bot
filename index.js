const axios = require('axios')

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {

  // Your code here
  app.log('Yay, the app was loaded!')

  app.on('installation.created', async context => {
    const payload = context.payload
    const repositories = payload.repositories
    for (let i=0; i<repositories.length; i++){
      const repository = repositories[i]
      const full_name = repository.full_name
      const parts = full_name.split('/')
      const owner = parts[0]
      const repo = parts[1]

      try {
        await context.github.issues.createLabel({
          owner: owner,
          repo: repo,
          name: 'has-reward',
          color: '008672', // green
          description: 'Issues with reward',
        })
      }
      catch(e){
        // already has the label, no big deal
      }

      const res = await context.github.issues.listForRepo({owner, repo})
      const openIssues = res.data
      for (let i=0; i<openIssues.length; i++){
        const issue = openIssues[i]
        const number = issue.number
        try {
          await context.github.issues.createComment({
            owner: owner,
            repo: repo,
            number: number,
            body: 'Consider add a reward for this issue to incentivize others fix it faster.',
          })
        }
        catch(e){
          // Failed to add comment to an issue
        }
      }
    }
  })

  app.on('issues.opened', async context => {
    app.log('A new issue was opened')
    const payload = context.payload
    const issue = payload.issue
    const issueUrl = issue.url
    const parseUrl = process.env.PARSE_HOST + 'parse/classes/issue'
    const config = {
      headers: {
        'X-Parse-Application-Id': 'ir'
      }
    }
    const body = {
      url: issueUrl,
      totalReward: 0,
    }
    let response
    try{
      response = await axios.post(parseUrl, body, config)
    }
    catch(e){
      app.log('Failed to post issue to parse.')
      app.log(e)
      return
    }
    const irId = response.data.objectId
    const irUrl = process.env.IR_HOST + 'github/' + irId

    const issueComment = context.issue({
      body: 'Consider add a reward for this issue to incentivize others fix it faster.\n You can do it here: ' + irUrl
    })
    return context.github.issues.createComment(issueComment)
  })

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
