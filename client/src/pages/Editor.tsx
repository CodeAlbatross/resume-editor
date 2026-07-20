import { useParams } from 'react-router-dom'

export default function Editor() {
  const { id } = useParams<{ id: string }>()
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">简历编辑器</h1>
      <p className="mt-2 text-gray-600">正在编辑简历: {id}</p>
    </div>
  )
}
