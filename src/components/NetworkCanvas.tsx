import { Box } from '@chakra-ui/react'
import { useEffect, useRef } from 'react'
import { DataSet, Network } from 'vis-network/standalone'
import type { GraphPayload } from '../types'
import type { Options } from 'vis-network/standalone'
const instantiateDataSet = (items: unknown[]) => {
  const DataSetAny = DataSet as unknown as { new (items?: unknown[]): DataSet<any> }
  return new DataSetAny(items)
}

type Props = {
  data: GraphPayload | null
  onNodeClick: (nodeId: string | null) => void
  completedNodes: Set<string>
  selectedNodeIds?: string[]
}

const networkOptions: Options = {
  interaction: { hover: true },
  physics: {
    stabilization: { iterations: 150 },
    barnesHut: { gravitationalConstant: -4000 },
  },
  nodes: {
    shape: 'dot',
    font: { multi: 'html', size: 18, strokeWidth: 3, strokeColor: 'white' },
    scaling: { min: 12, max: 40 },
    borderWidth: 2,
  },
  edges: {
    color: { color: '#cccccc', highlight: '#b0b0b0' },
    smooth: { enabled: true, type: 'continuous', roundness: 0.5 },
  },
}

export const NetworkCanvas = ({ data, onNodeClick, completedNodes, selectedNodeIds = [] }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const networkRef = useRef<Network | null>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (!data) {
      const emptyNodes = instantiateDataSet([])
      const emptyEdges = instantiateDataSet([])
      networkRef.current?.setData({ nodes: emptyNodes, edges: emptyEdges })
      return
    }

    if (!networkRef.current) {
      const nodeSet = instantiateDataSet(data.nodes as unknown[])
      const edgeSet = instantiateDataSet(data.edges as unknown[])
      const network = new Network(
        containerRef.current,
        {
          nodes: nodeSet,
          edges: edgeSet,
        },
        networkOptions,
      )
      networkRef.current = network
      network.on('click', (params) => {
        if (params.nodes.length > 0) {
          onNodeClick(params.nodes[0])
        } else {
          onNodeClick(null)
        }
      })
    } else {
      const nodeSet = instantiateDataSet(data.nodes as unknown[])
      const edgeSet = instantiateDataSet(data.edges as unknown[])
      networkRef.current.setData({
        nodes: nodeSet,
        edges: edgeSet,
      })
    }
  }, [data, onNodeClick])

  useEffect(() => {
    const network = networkRef.current
    if (!network) return
    const ids = Array.from(completedNodes)

    const tick = () => {
      const time = Date.now() / 400
      const amplitude = 15
      const baseSize = 30
      const pulse = baseSize + amplitude * Math.sin(time)

      if (ids.length > 0) {
        const visNetwork = network as unknown as {
          body?: { data?: { nodes?: DataSet<any> } }
        }
        const updates = ids
          .map((id) => {
            if (!visNetwork.body?.data?.nodes?.get(id)) return null
            return {
              id,
              shadow: { enabled: true, color: '#FFD700', size: pulse, x: 0, y: 0 },
              color: { border: '#FFD700' },
              font: { bold: { mod: 'normal' } },
            }
          })
          .filter(Boolean) as Array<Record<string, unknown>>
        if (updates.length > 0) {
          visNetwork.body?.data?.nodes?.update(updates)
        }
      }
      animationRef.current = requestAnimationFrame(tick)
    }

    animationRef.current = requestAnimationFrame(tick)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [completedNodes])

  useEffect(
    () => () => {
      networkRef.current?.destroy()
      networkRef.current = null
    },
    [],
  )

  useEffect(() => {
    const network = networkRef.current
    if (!network) return
    if (selectedNodeIds.length > 0) {
      network.selectNodes(selectedNodeIds)
      network.fit({ nodes: selectedNodeIds, animation: { duration: 700, easingFunction: 'easeInOutQuad' } })
    } else {
      network.unselectAll()
    }
  }, [selectedNodeIds])

  return <Box id="network" aria-label="共起ネットワーク" ref={containerRef} />
}
