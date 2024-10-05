function newNodeChildren () {
  thisObject = {
    childrenCount: childrenCount
  }

  return thisObject

  function childrenCount (parentNode, childNode) {
    return countChildrenUiObject(parentNode, childNode)
  }

  function countChildrenUiObject (parentNode, childNode) {
    let response = {
      childrenCount: 0,
      childIndex: undefined
    }
    let parentNodeDefinition = APP_SCHEMA_MAP.get(parentNode.type)
    if (parentNodeDefinition !== undefined) {
      if (parentNodeDefinition.properties !== undefined) {
        let previousPropertyName // Since there are cases where there are many properties with the same name,because they can hold nodes of different types but only one at the time, we have to avoind counting each property of those as individual children.

        for (let i = 0; i < parentNodeDefinition.properties.length; i++) {
          let property = parentNodeDefinition.properties[i]
          if (parentNode[property.name] !== undefined) {
            switch (property.type) {
              case 'node': {
                if (property.name !== previousPropertyName) {
                  response.childrenCount++
                  if (parentNode[property.name].id === childNode.id) {
                    response.childIndex = response.childrenCount
                  }
                  previousPropertyName = property.name
                }
              }
                break
              case 'array': {
                let nodeDefinition = APP_SCHEMA_MAP.get(childNode.type)
                if (nodeDefinition !== undefined) {
                  let nodePropertyArray = parentNode[property.name]
                  for (let j = 0; j < nodePropertyArray.length; j++) {
                    let child = nodePropertyArray[j]
                    if (nodeDefinition.chainedToSameType === true) {
                      if (j < 1) {
                        response.childrenCount++
                        if (child.id === childNode.id) {
                          response.childIndex = response.childrenCount
                        }
                      }
                    } else {
                      response.childrenCount++
                      if (child.id === childNode.id) {
                        response.childIndex = response.childrenCount
                      }
                    }
                  }
                }
              }
                break
            }
          }
        }
      }
    }

    return response
  }
}
